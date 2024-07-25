import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from '../customers/schemas/customer.schema';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConsumerService.name);

  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
  ) {}

  onModuleInit() {
    this.logger.log('RabbitMQConsumerService initialized');
  }


//CreateCustomerDto
  @EventPattern('create_customer')
  async handleMessagePrinted(@Payload() message: CreateCustomerDto) {
    this.logger.log(`Received message: ${JSON.stringify(message)}`);
    try {
      const createdCustomer = new this.customerModel(message);
      await createdCustomer.save();
      this.logger.log('Customer created successfully');
    } catch (error) {
      this.logger.error('Failed to create customer', (error as Error).stack);
    }

  }



}
