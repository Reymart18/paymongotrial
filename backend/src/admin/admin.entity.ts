import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity() // marks this class as a table
export class Admin {
    @PrimaryGeneratedColumn() // auto increment primary key
    id?: number;

    @Column({ unique: true }) // username should be unique
    username?: string;

    @Column()
    password?: string;

    @Column()
    fullName?: string;

    @Column({ default: 'admin' })
    role?: string;

    @Column({ default: true })
    passwordChanged?: boolean;
}
