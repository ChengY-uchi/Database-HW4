import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "bridge_film_actor" })
export class BridgeFilmActor {
    @PrimaryColumn({ name: "film_key", type: "integer" })
    film_key!: number;

    @PrimaryColumn({ name: "actor_key", type: "integer" })
    actor_key!: number;
}