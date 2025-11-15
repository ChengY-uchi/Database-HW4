import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "fact_rental" })
export class FactRental {
    @PrimaryGeneratedColumn({ name: "fact_rental_key" })
    fact_rental_key!: number;

    @Column({ name: "rental_id", type: "integer", unique: true })
    rental_id!: number;

    @Column({ name: "date_key_rented", type: "integer" })
    date_key_rented!: number;

    @Column({ name: "date_key_returned", type: "integer", nullable: true })
    date_key_returned?: number;

    @Column({ name: "film_key", type: "integer" })
    film_key!: number;

    @Column({ name: "store_key", type: "integer" })
    store_key!: number;

    @Column({ name: "customer_key", type: "integer" })
    customer_key!: number;

    @Column({ name: "staff_id", type: "integer" })
    staff_id!: number;

    @Column({ name: "rental_duration_days", type: "integer", nullable: true })
    rental_duration_days?: number;
}
