import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Customer } from "./Customer";
import { Staff } from "./Staff";
import { Rental } from "./Rental";

@Entity({ name: "payment" })
export class Payment {
    @PrimaryGeneratedColumn({ name: "payment_id", type: "int" })
    payment_id!: number;

    @Column({ name: "customer_id", type: "int" })
    customer_id!: number;

    @ManyToOne(() => Customer, { eager: false })
    @JoinColumn({ name: "customer_id" })
    customer?: Customer;

    @Column({ name: "staff_id", type: "tinyint" })
    staff_id!: number;

    @ManyToOne(() => Staff, { eager: false })
    @JoinColumn({ name: "staff_id" })
    staff?: Staff;

    @Column({ name: "rental_id", type: "int", nullable: true })
    rental_id?: number;

    @ManyToOne(() => Rental, { eager: false })
    @JoinColumn({ name: "rental_id" })
    rental?: Rental | null;

    @Column({ name: "amount", type: "decimal", precision: 5, scale: 2 })
    amount!: string;

    @Column({ name: "payment_date", type: "datetime" })
    payment_date!: Date;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
