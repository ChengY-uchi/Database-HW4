import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "dim_store" })
export class DimStore {
    @PrimaryGeneratedColumn({ name: "store_key", type: "integer" })
    store_key!: number;

    @Index({ unique: true })
    @Column({ name: "store_id", type: "integer" })
    store_id!: number;

    @Column({ name: "city", type: "text", nullable: true })
    city?: string;

    @Column({ name: "country", type: "text", nullable: true })
    country?: string;

    @Column({ name: "last_update", type: "datetime", nullable: true })
    last_update?: Date;
}
