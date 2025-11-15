import {
    Entity,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Film } from "./Film";
import { Actor } from "./Actor";

@Entity("film_actor")
export class FilmActor {
    @PrimaryColumn({ name: "actor_id" })
    actorId!: number;

    @PrimaryColumn({ name: "film_id" })
    filmId!: number;

    @ManyToOne(() => Actor, actor => actor.actor_id)
    @JoinColumn({ name: "actor_id" })
    actor!: Actor;

    @ManyToOne(() => Film, film => film.film_id)
    @JoinColumn({ name: "film_id" })
    film!: Film;
}
