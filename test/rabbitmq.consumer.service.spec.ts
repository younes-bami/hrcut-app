import { Test, TestingModule } from '@nestjs/testing';
import { RabbitMQConsumerService } from '../src/rabbitmq.consumer/rabbitmq.consumer.service';

describe('RabbitmqConsumerService', () => {
  let service: RabbitMQConsumerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RabbitMQConsumerService],
    }).compile();

    service = module.get<RabbitMQConsumerService>(RabbitMQConsumerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
