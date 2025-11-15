import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm";

@Entity("dim_category")
export class DimCategory {
    @PrimaryGeneratedColumn({ name: "category_key" })
    categoryKey!: number;

    @Column({ name: "category_id" })
    category_id!: number;

    @Column()
    name!: string;

    @Column({ name: "last_update", type: "datetime" })
    last_update!: Date;
}
