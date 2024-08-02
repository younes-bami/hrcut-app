import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import * as amqp from 'amqplib';
import { CustomersService } from '../customers/customers.service';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConsumerService.name);
  private connection!: amqp.Connection;
  private channel!: amqp.Channel;
  private readonly exchange = 'customer_exchange';
  private readonly queue = 'customer_queue';
  private readonly routingKey = 'create_customer';

  constructor(private readonly customersService: CustomersService) {}

  async onModuleInit() {
    try {
      this.connection = await amqp.connect('amqp://guest:guest@localhost:5672');
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, 'direct', { durable: true });
      await this.channel.assertQueue(this.queue, { durable: true });
      await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);
      await this.channel.consume(this.queue, async (msg) => {
        if (msg !== null) {
          const messageContent = msg.content.toString();
          this.logger.log(`Received message: ${messageContent}`);
          try {
            const { pattern, data } = JSON.parse(messageContent);
            if (pattern === 'create_customer') {
              this.logger.log('Processing the message');
              await this.customersService.createCustomer(data);
              this.logger.log('Customer created successfully');
              this.channel.ack(msg);
            }
          } catch (error) {
            this.logger.error('Failed to create customer', (error as Error).stack);
            this.channel.nack(msg, false, true);
          }
        }
      }, { noAck: false });
      this.logger.log('RabbitMQ consumer connected and listening for messages');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw new InternalServerErrorException('Failed to connect to RabbitMQ');
    }
  }
}


