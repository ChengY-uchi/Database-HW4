import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "film_category" })
export class FilmCategory {
    @PrimaryColumn({ name: "film_id", type: "int" })
    film_id!: number;

    @PrimaryColumn({ name: "category_id", type: "tinyint" })
    category_id!: number;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
