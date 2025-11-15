import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Address } from "./Address";

@Entity({ name: "staff" })
export class Staff {
    @PrimaryGeneratedColumn({ name: "staff_id", type: "tinyint" })
    staff_id!: number;

    @Column({ name: "first_name", type: "varchar", length: 45 })
    first_name!: string;

    @Column({ name: "last_name", type: "varchar", length: 45 })
    last_name!: string;

    @Column({ name: "address_id", type: "smallint" })
    address_id!: number;

    @ManyToOne(() => Address, { eager: false })
    @JoinColumn({ name: "address_id" })
    address?: Address;

    @Column({ type: "varchar", length: 50, nullable: true })
    email?: string;

    @Column({ name: "store_id", type: "tinyint", nullable: true })
    store_id?: number;

    @Column({ type: "tinyint", default: 1 })
    active!: number;

    @Column({ name: "username", type: "varchar", length: 16, nullable: true })
    username?: string;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
