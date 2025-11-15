import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "sync_state" })
export class SyncState {
    @PrimaryGeneratedColumn({ name: "id" })
    id!: number;

    @Column({ name: "table_name", unique: true })
    table_name!: string;

    // store as ISO string or null
    @Column({ name: "last_updated", nullable: true, type: "datetime" })
    last_updated!: Date | null;
}