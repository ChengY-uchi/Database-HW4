import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "country" })
export class Country {
    @PrimaryGeneratedColumn({ name: "country_id", type: "smallint" })
    country_id!: number;

    @Column({ type: "varchar", length: 50 })
    country!: string;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
