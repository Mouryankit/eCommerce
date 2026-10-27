import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity, OrderItemEntity, OrderStatus } from './entity/order.entity.js';
import { ProductEntity } from '../product/entity/product.entity.js';
import { CreateOrderInput, UpdateOrderStatusInput } from './args/order.args.js';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
  ) {}

  async createOrder(userId: number | null, input: CreateOrderInput): Promise<OrderEntity> {
    if (!input.items || input.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    let subtotal = 0;
    const orderItems: OrderItemEntity[] = [];

    // Calculate subtotal and adjust stock
    for (const item of input.items) {
      const lineTotal = Number(item.price) * item.quantity;
      subtotal += lineTotal;

      const orderItem = new OrderItemEntity();
      orderItem.productId = item.productId;
      orderItem.productName = item.productName;
      orderItem.price = Number(item.price);
      orderItem.quantity = item.quantity;
      orderItem.imageUrl = item.imageUrl || '';
      orderItems.push(orderItem);

      // Decrement inventory stock
      const product = await this.productRepo.findOne({ where: { id: item.productId } });
      if (product) {
        product.quantity = Math.max(0, product.quantity - item.quantity);
        await this.productRepo.save(product);
      }
    }

    const shipping = subtotal >= 150 ? 0 : 15;
    const tax = subtotal * 0.08;
    const grandTotal = subtotal + shipping + tax;

    const orderNumber = `AUR-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = new OrderEntity();
    order.orderNumber = orderNumber;
    order.userId = userId ?? 0;
    order.customerName = input.customerName;
    order.customerEmail = input.customerEmail;
    order.shippingAddress = input.shippingAddress;
    order.city = input.city || '';
    order.totalAmount = grandTotal;
    order.status = OrderStatus.PENDING;
    order.items = orderItems;

    return this.orderRepo.save(order);
  }

  async getMyOrders(userId: number): Promise<OrderEntity[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: { items: true },
    });
  }

  async getAllOrders(): Promise<OrderEntity[]> {
    return this.orderRepo.find({
      order: { createdAt: 'DESC' },
      relations: { items: true },
    });
  }

  async updateOrderStatus(input: UpdateOrderStatusInput): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id: input.orderId },
      relations: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${input.orderId} not found`);
    }

    order.status = input.status;
    return this.orderRepo.save(order);
  }
}
