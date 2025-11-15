import { Entity, PrimaryColumn } from "typeorm";

@Entity({ name: "bridge_film_category" })
export class BridgeFilmCategory {
    @PrimaryColumn({ name: "film_key", type: "integer" })
    film_key!: number;

    @PrimaryColumn({ name: "category_key", type: "integer" })
    category_key!: number;
}
