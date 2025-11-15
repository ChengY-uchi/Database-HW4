import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "category" })
export class Category {
    @PrimaryGeneratedColumn({ name: "category_id", type: "tinyint" })
    category_id!: number;

    @Column({ type: "varchar", length: 25 })
    name!: string;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
