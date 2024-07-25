import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthMiddleware } from '../common/middlewares/jwt-auth.middleware';
import { HttpModule } from '@nestjs/axios'; // Importer HttpModule
import { RabbitMQConsumerService } from '../rabbitmq.consumer/rabbitmq.consumer.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Customer.name, schema: CustomerSchema }]),
    JwtModule,
    HttpModule, // Ajouter HttpModule aux imports
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService, MongooseModule],
})
export class CustomersModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtAuthMiddleware)
      .forRoutes(
        { path: 'customers/me', method: RequestMethod.GET },
        { path: 'customers/:username', method: RequestMethod.GET },
        { path: 'customers/:id', method: RequestMethod.PUT },
      );
  }
}
