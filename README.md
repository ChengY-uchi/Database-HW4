# Data Sync Process: MySQL -> SQLite

A small ETL CLI that extracts data from a MySQL (Sakila-like) source and loads a SQLite analytics DB (star schema). This markdown file documents setup, environment variables, how to run each CLI command, and schema diagrams .

---

## Requirements

- Node.js 18+ (LTS recommended)
- npm or yarn
- MySQL server with Sakila-like schema (source)
- No external services required for the target — a local SQLite file is used

---

## Install

```bash
git clone <repo-url>
cd <repo>
npm install

# MySQL source (Sakila-like)
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=sakila_user
MYSQL_PASSWORD=secret
MYSQL_DATABASE=sakila

# SQLite target
SQLITE_PATH=sakila_lite.db
```

### Available commands:

* init — Initialize the SQLite analytics DB schema (ensure sync_state table and run TypeORM synchronize()).
* full-load — Full ETL load: loads dimensions, bridges, and facts; then runs validation.
* incremental — Incremental load: loads rows changed since last sync (based on sync_state) and runs validation.
* validate — Run post-sync validation checks only (counts + configured aggregates).
```
npx ts-node src/cli.ts init
npx ts-node src/cli.ts full-load
npx ts-node src/cli.ts incremental
npx ts-node src/cli.ts validate
```

## Schema Diagrams
### Mysql
```
erDiagram
    film {
        integer film_id PK
        string title
        integer language_id FK
        integer release_year
        integer length
        datetime last_update
    }
    actor {
        integer actor_id PK
        string first_name
        string last_name
        datetime last_update
    }
    film_actor {
        integer film_id FK
        integer actor_id FK
    }
    category {
        integer category_id PK
        string name
    }
    film_category {
        integer film_id FK
        integer category_id FK
    }
    rental {
        integer rental_id PK
        datetime rental_date
        datetime return_date
        integer inventory_id FK
        integer customer_id FK
        integer staff_id FK
    }
    payment {
        integer payment_id PK
        datetime payment_date
        numeric amount
        integer staff_id FK
        integer customer_id FK
    }
    inventory {
        integer inventory_id PK
        integer film_id FK
        integer store_id FK
    }
    customer {
        integer customer_id PK
        string first_name
        string last_name
    }
    store {
        integer store_id PK
        integer address_id
    }
    language {
        integer language_id PK
        string name
    }

    film }o--|| language : "language_id"
    film ||--o{ film_actor : "film_id"
    actor ||--o{ film_actor : "actor_id"
    film ||--o{ film_category : "film_id"
    category ||--o{ film_category : "category_id"
    rental }o--|| inventory : "inventory_id"
    inventory }o--|| film : "film_id"
    inventory }o--|| store : "store_id"
    payment }o--|| staff : "staff_id"
    payment }o--|| customer : "customer_id"

```
### SQLite
```
erDiagram
    DIM_FILM {
        integer film_key PK
        integer film_id
        string title
        string rating
        integer length
        integer language_id
        integer release_year
        datetime last_update
    }
    DIM_ACTOR {
        integer actor_key PK
        integer actor_id
        string first_name
        string last_name
        datetime last_update
    }
    DIM_CATEGORY {
        integer categoryKey PK
        integer category_id
        string name
        datetime last_update
    }
    DIM_STORE {
        integer store_key PK
        integer store_id
        string city
        string country
        datetime last_update
    }
    DIM_CUSTOMER {
        integer customer_key PK
        integer customer_id
        string first_name
        string last_name
        integer active
        string city
        string country
        datetime last_update
    }
    DIM_DATE {
        integer date_key PK
        date date
        integer year
        integer quarter
        integer month
        integer day_of_month
        integer day_of_week
        integer is_weekend
    }
    BRIDGE_FILM_ACTOR {
        integer film_key FK
        integer actor_key FK
    }
    BRIDGE_FILM_CATEGORY {
        integer film_key FK
        integer category_key FK
    }
    FACT_RENTAL {
        integer rental_id PK
        integer date_key_rented FK
        integer date_key_returned FK
        integer film_key FK
        integer store_key FK
        integer customer_key FK
        integer staff_id
        integer rental_duration_days
    }
    FACT_PAYMENT {
        integer payment_id PK
        integer date_key_paid FK
        integer customer_key FK
        integer store_key FK
        integer staff_id
        numeric amount
    }

    FACT_RENTAL ||--|| DIM_DATE : "date_key_rented -> date_key"
    FACT_RENTAL ||--|| DIM_DATE : "date_key_returned -> date_key"
    FACT_RENTAL }o--|| DIM_FILM : "film_key -> film_key"
    FACT_RENTAL }o--|| DIM_STORE : "store_key -> store_key"
    FACT_RENTAL }o--|| DIM_CUSTOMER : "customer_key -> customer_key"

    FACT_PAYMENT }o--|| DIM_DATE : "date_key_paid -> date_key"
    FACT_PAYMENT }o--|| DIM_CUSTOMER : "customer_key -> customer_key"
    FACT_PAYMENT }o--|| DIM_STORE : "store_key -> store_key"

    BRIDGE_FILM_ACTOR }o--|| DIM_FILM : "film_key -> film_key"
    BRIDGE_FILM_ACTOR }o--|| DIM_ACTOR : "actor_key -> actor_key"

    BRIDGE_FILM_CATEGORY }o--|| DIM_FILM : "film_key -> film_key"
    BRIDGE_FILM_CATEGORY }o--|| DIM_CATEGORY : "category_key -> categoryKey"
```
