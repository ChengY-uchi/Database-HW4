import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Address } from "./Address";

@Entity({ name: "store" })
export class Store {
    @PrimaryGeneratedColumn({ name: "store_id", type: "tinyint" })
    store_id!: number;

    @Column({ name: "manager_staff_id", type: "tinyint" })
    manager_staff_id!: number;

    @Column({ name: "address_id", type: "smallint" })
    address_id!: number;

    @ManyToOne(() => Address, { eager: false })
    @JoinColumn({ name: "address_id" })
    address?: Address;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
