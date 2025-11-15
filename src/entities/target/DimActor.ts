import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({ name: "dim_actor" })
export class DimActor {
    @PrimaryGeneratedColumn({ name: "actor_key", type: "integer" })
    actor_key!: number;

    @Index({ unique: true })
    @Column({ name: "actor_id", type: "integer" })
    actor_id!: number;

    @Column({ name: "first_name", type: "text" })
    first_name!: string;

    @Column({ name: "last_name", type: "text" })
    last_name!: string;

    @Column({ name: "last_update", type: "datetime", nullable: true })
    last_update?: Date;
}
