import { Controller, Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { CustomersService } from '../customers/customers.service';

@Controller()
export class RabbitMQConsumerController {
  private readonly logger = new Logger(RabbitMQConsumerController.name);

  constructor(
    private readonly customersService: CustomersService,
  ) {}

  @UsePipes(new ValidationPipe())
  @EventPattern('create_customer')
  async handleCreateCustomer(@Payload() message: CreateCustomerDto, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    this.logger.log(`Received Message: ${JSON.stringify(message)}`);
    try {
      // Process the message
      const createdCustomer = await this.customersService.createCustomer(message);
      this.logger.log('Customer created successfully');
      
      // Acknowledge the message
      channel.ack(originalMessage);
    } catch (error) {
      this.logger.error('Failed to create customer', (error as Error).stack);
      // Reject and requeue the message in case of failure
      channel.nack(originalMessage, false, true);
    }
  }
}
