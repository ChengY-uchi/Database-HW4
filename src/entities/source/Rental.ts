import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Inventory } from "./Inventory";
import { Customer } from "./Customer";
import { Staff } from "./Staff";

@Entity({ name: "rental" })
export class Rental {
    @PrimaryGeneratedColumn({ name: "rental_id", type: "int" })
    rental_id!: number;

    @Column({ name: "rental_date", type: "datetime" })
    rental_date!: Date;

    @Column({ name: "inventory_id", type: "int" })
    inventory_id!: number;

    @ManyToOne(() => Inventory, { eager: false })
    @JoinColumn({ name: "inventory_id" })
    inventory?: Inventory;

    @Column({ name: "customer_id", type: "int" })
    customer_id!: number;

    @ManyToOne(() => Customer, { eager: false })
    @JoinColumn({ name: "customer_id" })
    customer?: Customer;

    @Column({ name: "return_date", type: "datetime", nullable: true })
    return_date?: Date;

    @Column({ name: "staff_id", type: "tinyint" })
    staff_id!: number;

    @ManyToOne(() => Staff, { eager: false })
    @JoinColumn({ name: "staff_id" })
    staff?: Staff;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
