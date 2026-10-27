import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  type Relation,
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

@Entity({ name: 'orders' })
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  orderNumber: string;

  @Column({ nullable: true })
  userId: number;

  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column('numeric', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column()
  shippingAddress: string;

  @Column({ nullable: true })
  city: string;

  @OneToMany('OrderItemEntity', (item: OrderItemEntity) => item.order, {
    cascade: true,
    eager: true,
  })
  items: Relation<OrderItemEntity[]>;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity({ name: 'order_items' })
export class OrderItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  @ManyToOne(() => OrderEntity, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Relation<OrderEntity>;

  @Column()
  productId: number;

  @Column()
  productName: string;

  @Column('numeric', { precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ nullable: true })
  imageUrl: string;
}
