import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersModule } from './customers/customers.module';
import { AuthModule } from './auth/auth.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ComponentInterceptor } from './common/interceptors/component.interceptor';
import { LoggingMiddleware } from '../src/common/middleware/logging.middleware';
import { TokenVerificationMiddleware } from './common/middleware/token-verification.middleware';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        return {
          uri,
        };
      },
      inject: [ConfigService],
    }),
    CustomersModule,
    AuthModule,

  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ComponentInterceptor,
    },
  ],
})
export class AppModule {
 // configure(consumer: MiddlewareConsumer,TokenVerificationMiddleware: MiddlewareConsumer) {
 //   consumer
 //     consumer
  
 
 //    .apply(LoggingMiddleware)
 //     .forRoutes('*', method: RequestMethod.ALL ); // Appliquer le middleware à toutes les routes

  //    consumer
  //    .apply(TokenVerificationMiddleware)
  //    .forRoutes('*', method: RequestMethod.ALL ); // Appliquer le middleware à toutes les routes
 // }
}