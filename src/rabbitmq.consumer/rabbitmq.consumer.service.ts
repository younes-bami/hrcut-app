import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConsumerService.name);
  private connection!: amqp.Connection;
  private channel!: amqp.Channel;
  private readonly exchange = 'customer_exchange';
  private readonly queue = 'customer_queue';
  private readonly routingKey = 'create_customer';

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
          // Process the message
          this.channel.ack(msg);
          this.logger.log('Message acknowledged');
        }
      }, { noAck: false });
      this.logger.log('RabbitMQ consumer connected and listening for messages');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      throw new InternalServerErrorException('Failed to connect to RabbitMQ');
    }
  }
}
