import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm";

@Entity("dim_customer")
export class DimCustomer {
    @PrimaryGeneratedColumn({ name: "customer_key" })
    customer_key!: number;

    @Column({ name: "customer_id" })
    customer_id!: number;

    @Column({ name: "first_name" })
    first_name!: string;

    @Column({ name: "last_name" })
    last_name!: string;

    @Column()
    active!: number;

    @Column()
    city!: string;

    @Column()
    country!: string;

    @Column({ name: "last_update", type: "datetime" })
    last_update!: Date;
}
