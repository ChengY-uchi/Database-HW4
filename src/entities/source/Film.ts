import {Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn} from "typeorm";
import {User} from "../User";
import {Language} from "./Language";

@Entity({ name: "film" })
export class Film {
    @PrimaryGeneratedColumn({ name: "film_id" })
    film_id!: number;

    @Column({ type: "varchar" })
    title!: string;

    @Column({ type: "varchar" })
    rating!: string;

    @Column({ type: "tinyint" })
    length!: number;

    @Column({ name: "language_id", type: "tinyint" })
    language_id!: number;

    @Column({ name: "release_year", type: "smallint", nullable: true })
    release_year?: number;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;

    @ManyToOne(() => Language, (lang) => lang.films)
    @JoinColumn({ name: "language_id" })
    language!: Language;
}
