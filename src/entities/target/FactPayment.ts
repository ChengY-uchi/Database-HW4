import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "fact_payment" })
export class FactPayment {
    @PrimaryGeneratedColumn({ name: "fact_payment_key", type: "integer" })
    fact_payment_key!: number;

    @Index({ unique: true })
    @Column({ name: "payment_id", type: "integer" })
    payment_id!: number; // natural key

    @Column({ name: "date_key_paid", type: "integer" })
    date_key_paid!: number;

    @Column({ name: "customer_key", type: "integer" })
    customer_key!: number;

    @Column({ name: "store_key", type: "integer" })
    store_key!: number;

    @Column({ name: "staff_id", type: "integer" })
    staff_id!: number;

    @Column({ name: "amount", type: "real" })
    amount!: number;
}
