import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "dim_film" })
export class DimFilm {
    @PrimaryGeneratedColumn({ name: "film_key" })
    film_key!: number;

    @Index({ unique: true })
    @Column({ name: "film_id", type: "integer" })
    film_id!: number; // natural key from Sakila

    @Column()
    title!: string;

    @Column({ nullable: true })
    rating?: string;

    @Column({ type: "integer", nullable: true })
    length?: number;

    @Column({ nullable: true })
    language?: string;

    @Column({ type: "integer", nullable: true })
    release_year?: number;

    @Column({ type: "datetime", nullable: true })
    last_update?: Date;
}
