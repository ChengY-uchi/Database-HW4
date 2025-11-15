import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "meta_sync" })
export class MetaSync {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "last_sync_ts", type: "datetime", nullable: true })
    last_sync_ts?: Date;
}
