import { Module } from '@nestjs/common';
import { RabbitMQConsumerService } from './rabbitmq.consumer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { CustomersService } from '../customers/customers.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
  ],
  providers: [RabbitMQConsumerService,CustomersService],
  exports: [RabbitMQConsumerService], // S'assurer que le service est exporté
})
export class RabbitMQModule {}
