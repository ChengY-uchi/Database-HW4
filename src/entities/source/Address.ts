import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "address" })
export class Address {
    @PrimaryGeneratedColumn({ name: "address_id", type: "smallint" })
    address_id!: number;

    @Column({ type: "varchar", length: 50 })
    address!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    address2?: string;

    @Column({ type: "varchar", length: 20 })
    district!: string;

    @Column({ name: "city_id", type: "smallint" })
    city_id!: number;

    @Column({ name: "postal_code", type: "varchar", length: 10, nullable: true })
    postal_code?: string;

    @Column({ type: "varchar", length: 20, nullable: true })
    phone?: string;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
