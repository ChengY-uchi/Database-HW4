import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Film } from "./Film";

@Entity({ name: "language" })
export class Language {
    @PrimaryGeneratedColumn({ name: "language_id", type: "tinyint" })
    language_id!: number;

    @Column({ type: "varchar", length: 20 })
    name!: string;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;

    @OneToMany(() => Film, (f) => f.language_id)
    films?: Film[];
}
