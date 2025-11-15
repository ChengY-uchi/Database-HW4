import { Repository, ObjectLiteral, DeepPartial, DataSource } from "typeorm";
import { sqliteDataSource } from "../ormconfig";
import { DimDate } from "./entities/target/DimDate";
import { SyncState } from "./entities/target/SyncState";

export function dateToDateKey(d: Date | string): number {
    const dt = typeof d === "string" ? new Date(d) : d;
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return Number(`${yyyy}${mm}${dd}`);
}

export function dateToISODate(d: Date | string): string {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toISOString().slice(0, 10);
}

export async function ensureDimDateFor(dt: Date | string): Promise<DimDate> {
    const repo: Repository<DimDate> = sqliteDataSource.getRepository(DimDate);
    const iso = dateToISODate(dt);
    const dk = dateToDateKey(dt);

    const existing = await repo.findOne({ where: { date_key: dk } });
    if (existing) return existing;

    const d = new Date(iso);
    const dayOfWeek = d.getDay(); // 0 = Sunday
    const ent = repo.create({
        date_key: dk,
        date: iso,
        year: d.getFullYear(),
        quarter: Math.floor(d.getMonth() / 3) + 1,
        month: d.getMonth() + 1,
        day_of_month: d.getDate(),
        day_of_week: dayOfWeek,
        is_weekend: dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0,
    } as DeepPartial<DimDate>);
    return repo.save(ent);
}

export async function upsertByNaturalKey<T extends ObjectLiteral>(
    repo: Repository<T>,
    naturalKey: Partial<T>,
    values: DeepPartial<T>
): Promise<T> {
    const existing = await repo.findOne({ where: naturalKey as any });
    if (!existing) {
        const ent = repo.create({
            ...naturalKey,
            ...values,
        } as DeepPartial<T>);
        return repo.save(ent as any);
    }

    repo.merge(existing as any, values);
    return repo.save(existing as any);
}

export async function ensureSyncStateTable(): Promise<void> {
    await sqliteDataSource.manager.query(`
    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT UNIQUE,
      last_updated TEXT
    );
  `);
}

export async function getLastSyncFor(tableName: string): Promise<Date | null> {
    await ensureSyncStateTable();
    const repo = sqliteDataSource.getRepository(SyncState);
    const existing = await repo.findOne({ where: { table_name: tableName } });
    if (!existing || !existing.last_updated) return null;
    const d = new Date(existing.last_updated);
    return isNaN(d.getTime()) ? null : d;
}

export async function updateLastSyncFor(tableName: string, dt: Date | null): Promise<void> {
    await ensureSyncStateTable();
    const repo = sqliteDataSource.getRepository(SyncState);
    const iso = dt;
    const existing = await repo.findOne({ where: { table_name: tableName } });
    if (!existing) {
        const ent = repo.create({ table_name: tableName, last_updated: iso } as any);
        await repo.save(ent);
        return;
    }
    existing.last_updated = iso;
    await repo.save(existing);
}

export function getMaxTimestamp(rows: any[], field: string): Date | null {
    if (!rows || rows.length === 0) return null;
    let max: Date | null = null;
    for (const row of rows) {
        const val = row[field];
        if (val) {
            const dt = new Date(val);
            if (!max || dt > max) max = dt;
        }
    }
    return max;
}

/* Optional utilities: ensure SQLite indexes and validate sync results */

/**
 * Ensure indexes exist on the provided sqlite DataSource.
 * Each indexDef may provide either `sql` or `columns`.
 */
export type IndexDef = {
    table: string;
    name: string;
    sql?: string;
    columns?: string[];
};

export async function ensureSqliteIndexes(sqlite: DataSource, indexes: IndexDef[]): Promise<void> {
    for (const idx of indexes) {
        const sql =
            idx.sql ??
            (idx.columns && idx.columns.length
                ? `CREATE INDEX IF NOT EXISTS ${idx.name} ON ${idx.table} (${idx.columns.join(",")});`
                : null);
        if (!sql) continue;
        try {
            await sqlite.manager.query(sql);
        } catch (err) {
            console.error(`Failed to create index ${idx.name} on ${idx.table}:`, err);
        }
    }
}

export type SourceQueryFn = (sql: string, params?: any[]) => Promise<any[]>;

export type AggregateSpec = {
    name: string;
    sourceExpr: string;
    targetExpr?: string;
};

export type ValidationSpec = {
    tableName: string;
    sourceCountSql?: string;
    targetCountSql?: string;
    aggregates?: AggregateSpec[];
    threshold?: { percent?: number; absolute?: number };
};

function checkThreshold(sourceVal: number, targetVal: number, threshold: { percent?: number; absolute?: number } = { percent: 0.01, absolute: 1 }) {
    const diff = sourceVal - targetVal;
    const absDiff = Math.abs(diff);
    const percentDiff = sourceVal === 0 ? (absDiff === 0 ? 0 : 1) : absDiff / Math.abs(sourceVal);
    const exceeded =
        (threshold.absolute !== undefined && absDiff > threshold.absolute) ||
        (threshold.percent !== undefined && percentDiff > threshold.percent);
    return { diff, absDiff, percentDiff, exceeded };
}

export async function validateTableSync(
    sqlite: DataSource,
    sourceQuery: SourceQueryFn,
    spec: ValidationSpec
): Promise<{
    table: string;
    count: { source: number; target: number; ok: boolean; details: any };
    aggregates: Array<{ name: string; source: number; target: number; ok: boolean; details: any }>;
}> {
    const threshold = spec.threshold ?? { percent: 0.01, absolute: 1 };

    const sourceCountSql = spec.sourceCountSql ?? `SELECT COUNT(*) as cnt FROM ${spec.tableName};`;
    const targetCountSql = spec.targetCountSql ?? `SELECT COUNT(*) as cnt FROM ${spec.tableName};`;

    const sourceCountRows = await sourceQuery(sourceCountSql);
    const sourceCount = Number(sourceCountRows?.[0]?.cnt ?? 0);

    const targetCountRows = await sqlite.manager.query(targetCountSql);
    const targetCount = Number(targetCountRows?.[0]?.cnt ?? 0);

    const countCheck = checkThreshold(sourceCount, targetCount, threshold);
    const countOk = !countCheck.exceeded;

    const aggregatesResults: Array<{ name: string; source: number; target: number; ok: boolean; details: any }> = [];

    // try to extract table names from sourceCountSql / targetCountSql if present
    const extractFromTable = (sql?: string) => {
        if (!sql) return null;
        const m = sql.match(/from\s+([^\s;]+)/i);
        return m ? m[1] : null;
    };
    const sourceFromTable = extractFromTable(spec.sourceCountSql);
    const targetFromTable = extractFromTable(spec.targetCountSql);

    if (spec.aggregates && spec.aggregates.length) {
        for (const agg of spec.aggregates) {
            const rawSourceExpr = (agg.sourceExpr ?? "").trim();
            const rawTargetExpr = (agg.targetExpr ?? agg.sourceExpr ?? "").trim();

            // determine source SQL
            let sSql: string;
            if (/^\s*select/i.test(rawSourceExpr) || /\sfrom\s/i.test(rawSourceExpr)) {
                sSql = rawSourceExpr.endsWith(";") ? rawSourceExpr : `${rawSourceExpr};`;
            } else {
                const fromTable = sourceFromTable ?? spec.tableName;
                sSql = `SELECT ${rawSourceExpr} FROM ${fromTable};`;
            }

            // determine target SQL
            let tSql: string;
            if (/^\s*select/i.test(rawTargetExpr) || /\sfrom\s/i.test(rawTargetExpr)) {
                tSql = rawTargetExpr.endsWith(";") ? rawTargetExpr : `${rawTargetExpr};`;
            } else {
                const fromTable = targetFromTable ?? spec.tableName;
                tSql = `SELECT ${rawTargetExpr} FROM ${fromTable};`;
            }

            // execute
            const sRows = await sourceQuery(sSql).catch((e) => {
                throw new Error(`sourceQuery failed for aggregate ${agg.name}: ${String(e)} -- SQL: ${sSql}`);
            });
            const tRows = await sqlite.manager.query(tSql);

            const sVal = Number(sRows?.[0] ? Object.values(sRows[0])[0] ?? 0 : 0);
            const tVal = Number(tRows?.[0] ? Object.values(tRows[0])[0] ?? 0 : 0);

            const aggCheck = checkThreshold(sVal, tVal, threshold);
            aggregatesResults.push({
                name: agg.name,
                source: sVal,
                target: tVal,
                ok: !aggCheck.exceeded,
                details: aggCheck,
            });
        }
    }

    return {
        table: spec.tableName,
        count: {
            source: sourceCount,
            target: targetCount,
            ok: countOk,
            details: countCheck,
        },
        aggregates: aggregatesResults,
    };
}


export async function validateTablesAfterSync(
    sqlite: DataSource,
    sourceQuery: SourceQueryFn,
    specs: ValidationSpec[],
    options: { throwOnError?: boolean } = { throwOnError: false }
) {
    const results = [];
    let anyError = false;
    for (const s of specs) {
        try {
            const r = await validateTableSync(sqlite, sourceQuery, s);
            results.push(r);
            if (!r.count.ok) {
                console.error(`[VALIDATION] count mismatch for ${r.table}: source=${r.count.source} target=${r.count.target}`);
            } else {
                console.log(`[VALIDATION] count ok for ${r.table}: ${r.count.source}`);
            }
            for (const a of r.aggregates) {
                if (!a.ok) {
                    console.error(`[VALIDATION] aggregate mismatch ${r.table}.${a.name}: source=${a.source} target=${a.target}`);
                } else {
                    console.log(`[VALIDATION] aggregate ok ${r.table}.${a.name}: ${a.source}`);
                }
            }
            if (!r.count.ok || r.aggregates.some((x) => !x.ok)) anyError = true;
        } catch (err) {
            anyError = true;
            console.error(`Validation failed for ${s.tableName}:`, err);
            results.push({ table: s.tableName, error: String(err) });
        }
    }
    if (anyError && options.throwOnError) {
        throw new Error("Validation failed for one or more tables. See logs for details.");
    }
    return results;
}
