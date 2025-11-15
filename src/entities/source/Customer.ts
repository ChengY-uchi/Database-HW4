import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Address } from "./Address";

@Entity({ name: "customer" })
export class Customer {
    @PrimaryGeneratedColumn({ name: "customer_id", type: "int" })
    customer_id!: number;

    @Column({ name: "store_id", type: "tinyint" })
    store_id!: number;

    @Column({ name: "first_name", type: "varchar", length: 45 })
    first_name!: string;

    @Column({ name: "last_name", type: "varchar", length: 45 })
    last_name!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    email?: string;

    @Column({ name: "address_id", type: "smallint" })
    address_id!: number;

    @ManyToOne(() => Address, { eager: false })
    @JoinColumn({ name: "address_id" })
    address?: Address;

    @Column({ type: "tinyint", default: 1 })
    active!: number;

    @Column({ name: "create_date", type: "datetime" })
    create_date!: Date;

    @Column({ name: "last_update", type: "timestamp", nullable: true })
    last_update?: Date;
}
