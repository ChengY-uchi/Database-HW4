import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "actor" })
export class Actor {
    @PrimaryGeneratedColumn({ name: "actor_id", type: "int" })
    actor_id!: number;

    @Column({ name: "first_name", type: "varchar", length: 45 })
    first_name!: string;

    @Column({ name: "last_name", type: "varchar", length: 45 })
    last_name!: string;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
