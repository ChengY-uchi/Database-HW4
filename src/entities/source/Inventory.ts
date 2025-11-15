import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { Film } from "./Film";
import { Store } from "./Store";

@Entity({ name: "inventory" })
export class Inventory {
    @PrimaryGeneratedColumn({ name: "inventory_id", type: "int" })
    inventory_id!: number;

    @Column({ name: "film_id", type: "int" })
    film_id!: number;

    @ManyToOne(() => Film, { eager: false })
    @JoinColumn({ name: "film_id" })
    film?: Film;

    @Column({ name: "store_id", type: "tinyint" })
    store_id!: number;

    @ManyToOne(() => Store, (s) => s.store_id, { eager: false })
    @JoinColumn({ name: "store_id" })
    store?: Store;

    @Column({ name: "last_update", type: "timestamp" })
    last_update!: Date;
}
