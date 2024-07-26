import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class RabbitMQConsumerService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQConsumerService.name);

  onModuleInit() {
    this.logger.log('RabbitMQConsumerService initialized');
  }
}
