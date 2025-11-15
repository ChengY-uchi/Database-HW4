import "reflect-metadata";
import { mysqlDataSource, sqliteDataSource } from "../ormconfig";
import * as Source from "./entities/source";
import * as Target from "./entities/target";
import {
    upsertByNaturalKey,
    ensureDimDateFor,
    dateToDateKey,
    getLastSyncFor,
    updateLastSyncFor,
    ensureSyncStateTable,
    getMaxTimestamp,
    ensureSqliteIndexes,
    validateTablesAfterSync,
} from "./etl_helper";
import { MoreThan } from "typeorm";

const command = process.argv[2];

async function connectAll() {
    if (!mysqlDataSource.isInitialized) await mysqlDataSource.initialize();
    if (!sqliteDataSource.isInitialized) await sqliteDataSource.initialize();
}

async function makeSourceQuery() {
    return async (sql: string, params?: any[]) => {
        return await mysqlDataSource.manager.query(sql, params ?? []);
    };
}

const validationSpecs = [
    {
        tableName: "dim_film",
        sourceCountSql: "SELECT COUNT(*) AS cnt FROM film;",
        targetCountSql: "SELECT COUNT(*) AS cnt FROM dim_film;",
    },
    {
        tableName: "dim_actor",
        sourceCountSql: "SELECT COUNT(*) AS cnt FROM actor;",
        targetCountSql: "SELECT COUNT(*) AS cnt FROM dim_actor;",
    },
    {
        tableName: "fact_rental",
        sourceCountSql: "SELECT COUNT(*) AS cnt FROM rental;",
        targetCountSql: "SELECT COUNT(*) AS cnt FROM fact_rental;",
    },
    {
        tableName: "fact_payment",
        sourceCountSql: "SELECT COUNT(*) AS cnt FROM payment;",
        targetCountSql: "SELECT COUNT(*) AS cnt FROM fact_payment;",
        aggregates: [
            { name: "total_amount", sourceExpr: "SUM(amount) as total_amount", targetExpr: "SUM(amount) as total_amount" }
        ],
        threshold: { percent: 0.05, absolute: 5 } // 5% or 5 currency units
    }
];

/* ==================== DIMENSION LOADERS ==================== */

async function loadDimFilm(lastSync: Date | null = null) {
    console.log("Loading dim_film...");
    const mysqlRepo = mysqlDataSource.getRepository(Source.Film);
    const sqliteRepo = sqliteDataSource.getRepository(Target.DimFilm);
    const mysqlRepo2 = mysqlDataSource.getRepository(Source.Language);

    const where = lastSync ? { last_update: MoreThan(lastSync) } : {};
    const films = await mysqlRepo.find({ where, relations: ["language"] });


    for (const film of films) {
        await upsertByNaturalKey(
            sqliteRepo,
            { film_id: film.film_id },
            {
                title: film.title,
                rating: film.rating,
                length: film.length,
                language: film.language.name,
                release_year: film.release_year,
                last_update: film.last_update || new Date(),
            }
        );
    }

    const maxUpdate = getMaxTimestamp(films, "last_update");
    if (maxUpdate) await updateLastSyncFor("dim_film", maxUpdate);
    console.log(`✓ Loaded ${films.length} films`);
}

async function loadDimActor(lastSync: Date | null = null) {
    console.log("Loading dim_actor...");
    const mysqlRepo = mysqlDataSource.getRepository(Source.Actor);
    const sqliteRepo = sqliteDataSource.getRepository(Target.DimActor);

    const where = lastSync ? { last_update: MoreThan(lastSync) } : {};
    const actors = await mysqlRepo.find({ where });

    for (const actor of actors) {
        await upsertByNaturalKey(
            sqliteRepo,
            { actor_id: actor.actor_id },
            {
                first_name: actor.first_name,
                last_name: actor.last_name,
                last_update: actor.last_update || new Date(),
            }
        );
    }

    const maxUpdate = getMaxTimestamp(actors, "last_update");
    if (maxUpdate) await updateLastSyncFor("dim_actor", maxUpdate);
    console.log(`✓ Loaded ${actors.length} actors`);
}

async function loadDimCategory(lastSync: Date | null = null) {
    console.log("Loading dim_category...");
    const mysqlRepo = mysqlDataSource.getRepository(Source.Category);
    const sqliteCategoryRepo = sqliteDataSource.getRepository(Target.DimCategory);

    const where = lastSync ? { last_update: MoreThan(lastSync) } : {};
    const categories = await mysqlRepo.find({ where });

    for (const cat of categories) {
        await upsertByNaturalKey(
            sqliteCategoryRepo,
            { category_id: cat.category_id },
            {
                name: cat.name,
                last_update: cat.last_update || new Date(),
            }
        );
    }

    const maxUpdate = getMaxTimestamp(categories, "last_update");
    if (maxUpdate) await updateLastSyncFor("dim_category", maxUpdate);
    console.log(`✓ Loaded ${categories.length} categories`);
}

async function loadDimStore(lastSync: Date | null = null) {
    console.log("Loading dim_store...");
    const mysqlStoreRepo = mysqlDataSource.getRepository(Source.Store);
    const mysqlAddressRepo = mysqlDataSource.getRepository(Source.Address);
    const mysqlCityRepo = mysqlDataSource.getRepository(Source.City);
    const mysqlCountryRepo = mysqlDataSource.getRepository(Source.Country);
    const sqliteRepo = sqliteDataSource.getRepository(Target.DimStore);

    const where = lastSync ? { last_update: MoreThan(lastSync) } : {};
    const stores = await mysqlStoreRepo.find({ where });

    for (const store of stores) {
        const address = await mysqlAddressRepo.findOneBy({ address_id: store.address_id });
        let city = "Unknown";
        let country = "Unknown";

        if (address) {
            const cityRow = await mysqlCityRepo.findOneBy({ city_id: address.city_id });
            if (cityRow) {
                city = cityRow.city;
                const countryRow = await mysqlCountryRepo.findOneBy({
                    country_id: cityRow.country_id,
                });
                if (countryRow) country = countryRow.country;
            }
        }

        await upsertByNaturalKey(
            sqliteRepo,
            { store_id: store.store_id },
            {
                city,
                country,
                last_update: store.last_update || new Date(),
            }
        );
    }

    const maxUpdate = getMaxTimestamp(stores, "last_update");
    if (maxUpdate) await updateLastSyncFor("dim_store", maxUpdate);
    console.log(`✓ Loaded ${stores.length} stores`);
}

async function loadDimCustomer(lastSync: Date | null = null) {
    console.log("Loading dim_customer...");
    const mysqlCustomerRepo = mysqlDataSource.getRepository(Source.Customer);
    const mysqlAddressRepo = mysqlDataSource.getRepository(Source.Address);
    const mysqlCityRepo = mysqlDataSource.getRepository(Source.City);
    const mysqlCountryRepo = mysqlDataSource.getRepository(Source.Country);
    const sqliteRepo = sqliteDataSource.getRepository(Target.DimCustomer);

    const where = lastSync ? { last_update: MoreThan(lastSync) } : {};
    const customers = await mysqlCustomerRepo.find({ where });

    for (const customer of customers) {
        const address = await mysqlAddressRepo.findOneBy({
            address_id: customer.address_id,
        });
        let city = "Unknown";
        let country = "Unknown";

        if (address) {
            const cityRow = await mysqlCityRepo.findOneBy({ city_id: address.city_id });
            if (cityRow) {
                city = cityRow.city;
                const countryRow = await mysqlCountryRepo.findOneBy({
                    country_id: cityRow.country_id,
                });
                if (countryRow) country = countryRow.country;
            }
        }

        await upsertByNaturalKey(
            sqliteRepo,
            { customer_id: customer.customer_id },
            {
                first_name: customer.first_name,
                last_name: customer.last_name,
                active: customer.active,
                city,
                country,
                last_update: customer.last_update || new Date(),
            }
        );
    }

    const maxUpdate = getMaxTimestamp(customers, "last_update");
    if (maxUpdate) await updateLastSyncFor("dim_customer", maxUpdate);
    console.log(`✓ Loaded ${customers.length} customers`);
}

/* ==================== BRIDGE LOADERS ==================== */

async function loadBridgeFilmActor() {
    console.log("Loading bridge_film_actor...");
    const mysqlRepo = mysqlDataSource.getRepository(Source.FilmActor);
    const sqliteFilmRepo = sqliteDataSource.getRepository(Target.DimFilm);
    const sqliteActorRepo = sqliteDataSource.getRepository(Target.DimActor);
    const sqliteBridgeRepo = sqliteDataSource.getRepository(Target.BridgeFilmActor);

    const filmActors = await mysqlRepo.find();

    for (const fa of filmActors) {
        const dimFilm = await sqliteFilmRepo.findOneBy({ film_id: fa.filmId });
        const dimActor = await sqliteActorRepo.findOneBy({ actor_id: fa.actorId });

        if (!dimFilm || !dimActor) continue;

        const existing = await sqliteBridgeRepo.findOne({
            where: {
                film_key: dimFilm.film_key,
                actor_key: dimActor.actor_key,
            } as any,
        });

        if (!existing) {
            await sqliteBridgeRepo.save({
                film_key: dimFilm.film_key,
                actor_key: dimActor.actor_key,
            } as any);
        }
    }

    console.log(`✓ Loaded ${filmActors.length} film-actor links`);
}

async function loadBridgeFilmCategory() {
    console.log("Loading bridge_film_category...");
    const mysqlRepo = mysqlDataSource.getRepository(Source.FilmCategory);
    const sqliteFilmRepo = sqliteDataSource.getRepository(Target.DimFilm);
    const sqliteCategoryRepo = sqliteDataSource.getRepository(Target.DimCategory);
    const sqliteBridgeRepo = sqliteDataSource.getRepository(Target.BridgeFilmCategory);

    const filmCategories = await mysqlRepo.find();

    for (const fc of filmCategories) {
        const dimFilm = await sqliteFilmRepo.findOneBy({ film_id: fc.film_id });
        const dimCategory = await sqliteCategoryRepo.findOneBy({
            category_id: fc.category_id,
        });

        if (!dimFilm || !dimCategory) continue;

        const existing = await sqliteBridgeRepo.findOne({
            where: {
                film_key: dimFilm.film_key,
                category_key: dimCategory.categoryKey,
            } as any,
        });

        if (!existing) {
            await sqliteBridgeRepo.save({
                film_key: dimFilm.film_key,
                category_key: dimCategory.categoryKey,
            } as any);
        }
    }

    console.log(`✓ Loaded ${filmCategories.length} film-category links`);
}

/* ==================== FACT LOADERS ==================== */

async function loadFactRental(lastSync: Date | null = null) {
    console.log("Loading fact_rental...");
    const mysqlRentalRepo = mysqlDataSource.getRepository(Source.Rental);
    const mysqlInventoryRepo = mysqlDataSource.getRepository(Source.Inventory);
    const sqliteRepo = sqliteDataSource.getRepository(Target.FactRental);
    const sqliteFilmRepo = sqliteDataSource.getRepository(Target.DimFilm);
    const sqliteStoreRepo = sqliteDataSource.getRepository(Target.DimStore);
    const sqliteCustomerRepo = sqliteDataSource.getRepository(Target.DimCustomer);

    const where = lastSync ? { rental_date: MoreThan(lastSync) } : {};
    const rentals = await mysqlRentalRepo.find({ where });

    for (const rental of rentals) {
        const inventory = await mysqlInventoryRepo.findOneBy({
            inventory_id: rental.inventory_id,
        });
        if (!inventory) continue;

        const dimFilm = await sqliteFilmRepo.findOneBy({ film_id: inventory.film_id });
        const dimStore = await sqliteStoreRepo.findOneBy({ store_id: inventory.store_id });
        const dimCustomer = await sqliteCustomerRepo.findOneBy({
            customer_id: rental.customer_id,
        });

        if (!dimFilm || !dimStore || !dimCustomer) continue;

        await ensureDimDateFor(rental.rental_date);
        const dateKeyRented = dateToDateKey(rental.rental_date);
        let dateKeyReturned: number | undefined = undefined;
        let rentalDuration: number | undefined = undefined;

        if (rental.return_date) {
            await ensureDimDateFor(rental.return_date);
            dateKeyReturned = dateToDateKey(rental.return_date);
            const diff = rental.return_date.getTime() - rental.rental_date.getTime();
            rentalDuration = Math.floor(diff / (1000 * 60 * 60 * 24));
        }

        await upsertByNaturalKey(
            sqliteRepo,
            { rental_id: rental.rental_id },
            {
                date_key_rented: dateKeyRented,
                date_key_returned: dateKeyReturned,
                film_key: dimFilm.film_key,
                store_key: dimStore.store_key,
                customer_key: dimCustomer.customer_key,
                staff_id: rental.staff_id,
                rental_duration_days: rentalDuration,
            }
        );
    }

    const maxUpdate = getMaxTimestamp(rentals, "rental_date");
    if (maxUpdate) await updateLastSyncFor("fact_rental", maxUpdate);
    console.log(`✓ Loaded ${rentals.length} rentals`);
}

async function loadFactPayment(lastSync: Date | null = null) {
    console.log("Loading fact_payment...");
    const mysqlPaymentRepo = mysqlDataSource.getRepository(Source.Payment);
    const mysqlStaffRepo = mysqlDataSource.getRepository(Source.Staff);
    const sqliteRepo = sqliteDataSource.getRepository(Target.FactPayment);
    const sqliteStoreRepo = sqliteDataSource.getRepository(Target.DimStore);
    const sqliteCustomerRepo = sqliteDataSource.getRepository(Target.DimCustomer);

    const where = lastSync ? { payment_date: MoreThan(lastSync) } : {};
    const payments = await mysqlPaymentRepo.find({ where });

    for (const payment of payments) {
        const staff = await mysqlStaffRepo.findOneBy({ staff_id: payment.staff_id });
        if (!staff) continue;

        const dimStore = await sqliteStoreRepo.findOneBy({ store_id: staff.store_id });
        const dimCustomer = await sqliteCustomerRepo.findOneBy({
            customer_id: payment.customer_id,
        });

        if (!dimStore || !dimCustomer) continue;

        await ensureDimDateFor(payment.payment_date);

        await upsertByNaturalKey(
            sqliteRepo,
            { payment_id: payment.payment_id },
            {
                date_key_paid: dateToDateKey(payment.payment_date),
                customer_key: dimCustomer.customer_key,
                store_key: dimStore.store_key,
                staff_id: payment.staff_id,
                amount: Number(payment.amount),
            }
        );
    }

    const maxUpdate = getMaxTimestamp(payments, "payment_date");
    if (maxUpdate) await updateLastSyncFor("fact_payment", maxUpdate);
    console.log(`✓ Loaded ${payments.length} payments`);
}

/* ==================== CLI COMMANDS ==================== */

async function cmdInit() {
    console.log("=== INIT: Initializing analytics database ===");
    try {
        await connectAll();
        await ensureSyncStateTable();
        await sqliteDataSource.synchronize();
        console.log("✓ Analytics database initialized successfully");
    } catch (err) {
        console.error("✗ Init failed:", err);
        throw err;
    } finally {
        await sqliteDataSource.destroy();
        await mysqlDataSource.destroy();
    }
}

async function cmdFullLoad() {
    console.log("=== FULL-LOAD: Loading all data ===");
    try {
        await connectAll();
        await ensureSyncStateTable();

        // optional: create recommended indexes on sqlite before loading to speed up work
        // await ensureSqliteIndexes(sqliteDataSource, recommendedIndexesForSakila);

        // Load dimensions
        await loadDimFilm();
        await loadDimActor();
        await loadDimCategory();
        await loadDimStore();
        await loadDimCustomer();

        // Load bridges
        await loadBridgeFilmActor();
        await loadBridgeFilmCategory();

        // Load facts
        await loadFactRental();
        await loadFactPayment();

        console.log("✓ Full load completed successfully");

        // Validation step
        const sourceQuery = await makeSourceQuery();
        const results = await validateTablesAfterSync(sqliteDataSource, sourceQuery, validationSpecs, { throwOnError: false });
        console.log("Validation summary:", results);
    } catch (err) {
        console.error("✗ Full load failed:", err);
        throw err;
    } finally {
        await sqliteDataSource.destroy();
        await mysqlDataSource.destroy();
    }
}


async function cmdIncremental() {
    console.log("=== INCREMENTAL: Loading changed data ===");
    try {
        await connectAll();
        await ensureSyncStateTable();

        // Load dimensions with last sync check
        await loadDimFilm(await getLastSyncFor("dim_film"));
        await loadDimActor(await getLastSyncFor("dim_actor"));
        await loadDimCategory(await getLastSyncFor("dim_category"));
        await loadDimStore(await getLastSyncFor("dim_store"));
        await loadDimCustomer(await getLastSyncFor("dim_customer"));

        // Reload bridges (they don't have timestamps)
        await loadBridgeFilmActor();
        await loadBridgeFilmCategory();

        // Load facts with last sync check
        await loadFactRental(await getLastSyncFor("fact_rental"));
        await loadFactPayment(await getLastSyncFor("fact_payment"));

        console.log("✓ Incremental load completed successfully");

        // Validation step
        const sourceQuery = await makeSourceQuery();
        const results = await validateTablesAfterSync(sqliteDataSource, sourceQuery, validationSpecs, { throwOnError: false });
        console.log("Validation summary:", results);
    } catch (err) {
        console.error("✗ Incremental load failed:", err);
        throw err;
    } finally {
        await sqliteDataSource.destroy();
        await mysqlDataSource.destroy();
    }
}


async function cmdValidate() {
    console.log("=== VALIDATE: Checking data consistency ===");
    try {
        await connectAll();

        const checks: { name: string; mysql: number; sqlite: number }[] = [];

        // Count films
        const mysqlFilmCount = await mysqlDataSource
            .getRepository(Source.Film)
            .count();
        const sqliteFilmCount = await sqliteDataSource
            .getRepository(Target.DimFilm)
            .count();
        checks.push({ name: "Films", mysql: mysqlFilmCount, sqlite: sqliteFilmCount });

        // Count actors
        const mysqlActorCount = await mysqlDataSource
            .getRepository(Source.Actor)
            .count();
        const sqliteActorCount = await sqliteDataSource
            .getRepository(Target.DimActor)
            .count();
        checks.push({
            name: "Actors",
            mysql: mysqlActorCount,
            sqlite: sqliteActorCount,
        });

        // Count rentals
        const mysqlRentalCount = await mysqlDataSource
            .getRepository(Source.Rental)
            .count();
        const sqliteRentalCount = await sqliteDataSource
            .getRepository(Target.FactRental)
            .count();
        checks.push({
            name: "Rentals",
            mysql: mysqlRentalCount,
            sqlite: sqliteRentalCount,
        });

        // Count payments
        const mysqlPaymentCount = await mysqlDataSource
            .getRepository(Source.Payment)
            .count();
        const sqlitePaymentCount = await sqliteDataSource
            .getRepository(Target.FactPayment)
            .count();
        checks.push({
            name: "Payments",
            mysql: mysqlPaymentCount,
            sqlite: sqlitePaymentCount,
        });

        console.log("\n--- Validation Results ---");
        let hasErrors = false;
        for (const check of checks) {
            const diff = Math.abs(check.mysql - check.sqlite);
            const pct = check.mysql > 0 ? (diff / check.mysql) * 100 : 0;
            const status = pct > 5 ? "✗ MISMATCH" : "✓ OK";
            console.log(
                `${status} ${check.name}: MySQL=${check.mysql}, SQLite=${check.sqlite} (${pct.toFixed(
                    1
                )}% diff)`
            );
            if (pct > 5) hasErrors = true;
        }

        if (hasErrors) {
            console.log("\n⚠ Validation found inconsistencies");
        } else {
            console.log("\n✓ All validation checks passed");
        }
    } catch (err) {
        console.error("✗ Validation failed:", err);
        throw err;
    } finally {
        await sqliteDataSource.destroy();
        await mysqlDataSource.destroy();
    }
}

/* ==================== MAIN ==================== */

(async () => {
    try {
        switch (command) {
            case "init":
                await cmdInit();
                break;
            case "full-load":
                await cmdFullLoad();
                break;
            case "incremental":
                await cmdIncremental();
                break;
            case "validate":
                await cmdValidate();
                break;
            default:
                console.error("Unknown command:", command);
                console.error("Usage: ts-node src/cli.ts <init|full-load|incremental|validate>");
                process.exit(1);
        }
        process.exit(0);
    } catch (err) {
        console.error("CLI failed:", err);
        process.exit(1);
    }
})();