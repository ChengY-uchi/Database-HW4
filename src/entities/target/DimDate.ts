import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "dim_date" })
export class DimDate {
    @PrimaryColumn({ name: "date_key", type: "integer" })
    date_key!: number; // YYYYMMDD

    @Column({ type: "date" })
    date!: string;

    @Column()
    year!: number;

    @Column()
    quarter!: number;

    @Column()
    month!: number;

    @Column({ name: "day_of_month" })
    day_of_month!: number;

    @Column({ name: "day_of_week" })
    day_of_week!: number;

    @Column({ name: "is_weekend", type: "integer" })
    is_weekend!: number;
}
