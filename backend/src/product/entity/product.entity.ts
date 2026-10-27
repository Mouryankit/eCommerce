
import { Entity,  PrimaryGeneratedColumn,  Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'product' })
export class ProductEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string; 

  @Column()
  imageUrl: string; 

  @Column('numeric', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number; 

  @CreateDateColumn()
  createdAt: Date;
}
