import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "city" })
export class City {
    @PrimaryGeneratedColumn({ name: "city_id", type: "smallint" })
    city_id!: number;

    @Column({ type: "varchar", length: 50 })
    city!: string;

    @Column({ name: "country_id", type: "smallint" })
    country_id!: number;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
