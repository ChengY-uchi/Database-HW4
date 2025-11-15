// ormconfig.ts
import { DataSource } from "typeorm";

/**
 * IMPORTANT:
 * - adjust env vars or fill defaults below before running
 */

import * as SourceEntities from "./src/entities/source";
import * as TargetEntities from "./src/entities/target";

export const mysqlDataSource = new DataSource({
    type: "mysql",
    host: "127.0.0.1",
    port: 3306,
    username: "root",
    password: "Yang0335",
    database: "sakila",
    entities: [
        SourceEntities.Film,
        SourceEntities.Language,
        SourceEntities.Actor,
        SourceEntities.Category,
        SourceEntities.FilmActor,
        SourceEntities.FilmCategory,
        SourceEntities.Inventory,
        SourceEntities.Store,
        SourceEntities.Address,
        SourceEntities.City,
        SourceEntities.Country,
        SourceEntities.Customer,
        SourceEntities.Staff,
        SourceEntities.Rental,
        SourceEntities.Payment,
    ],
});

export const sqliteDataSource = new DataSource({
    type: "sqlite",
    database: "sakila_lite.db",
    entities: [
        TargetEntities.DimDate,
        TargetEntities.DimFilm,
        TargetEntities.DimActor,
        TargetEntities.DimCategory,
        TargetEntities.DimStore,
        TargetEntities.DimCustomer,
        TargetEntities.BridgeFilmActor,
        TargetEntities.BridgeFilmCategory,
        TargetEntities.FactRental,
        TargetEntities.FactPayment,
        TargetEntities.MetaSync, // previous meta, optional
        TargetEntities.SyncState,
    ],
    synchronize: true, // create/alter sqlite schema at init
    // logging: false,
});
