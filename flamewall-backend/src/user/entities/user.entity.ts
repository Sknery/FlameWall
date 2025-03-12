import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')

export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 20 })
    email: string;

    @Column({ type: 'varchar', length: 50 })
    password: string;

    @Column({ type: 'varchar', length: 20 })
    MC_username: string;

    @Column({ type: 'varchar', length: 20 })
    rank: Rank;
}

export enum Rank {
    DEFAULT = 'Default',
    MOON = 'Moon',
    NEBULA = 'Nebula',
    NOVA = 'Nova',
    SUPERNOVA = 'Supernova',
    Quasar = ''
}
