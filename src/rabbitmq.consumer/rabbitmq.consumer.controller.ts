import { Controller, Logger , UsePipes, ValidationPipe} from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { CustomersService } from '../customers/customers.service';

@Controller()
export class RabbitMQConsumerController {
  private readonly logger = new Logger(RabbitMQConsumerController.name);

  constructor(
    private readonly customersService: CustomersService, // Injection du service
  ) {}

  @UsePipes(new ValidationPipe())
  @EventPattern('create_customer')
  async handleCreateCustomer(@Payload() message: CreateCustomerDto) {
    this.logger.log(`Received message: ${JSON.stringify(message)}`);
    try {
      const createdCustomer = await this.customersService.createCustomer(message);
      this.logger.log('Customer created successfully');
    } catch (error) {
      this.logger.error('Failed to create customer', (error as Error).stack);
    }
  }
}
