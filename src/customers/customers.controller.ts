import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UseInterceptors,
  UseGuards,
  ConflictException,
  Req,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerDocument } from './schemas/customer.schema';
import { createNotFoundError } from '../common/utils/error.utils';
import { Component } from '../common/decorators/component.decorator';
import { ComponentInterceptor } from '../common/interceptors/component.interceptor';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtRequest } from '../common/types/custom';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@ApiTags('customers')
@UseInterceptors(ComponentInterceptor)
@Controller('customers')
@Component('CustomersController')
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly customersService: CustomersService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current customer' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentCustomer(@Req() req: JwtRequest) {
    const user = req.user;
    this.logger.debug(`Current user from JWT: ${JSON.stringify(user)}`);

    if (!user || !user.sub) {
      this.logger.warn('Unauthorized access attempt');
      throw new UnauthorizedException();
    }

    try {
      this.logger.debug(`Getting current customer with username: ${user.username}`);
      const customer = await this.customersService.findOne(user.username);
      if (!customer) {
        this.logger.warn(`Customer with username: ${user.username} not found`);
        throw new NotFoundException(`Customer with username: ${user.username} not found`);
      }

      this.logger.debug(`Current customer details: ${JSON.stringify(customer)}`);
      return customer;
    } catch (error: unknown) {
      this.logger.error(`Error in getCurrentCustomer: ${JSON.stringify(error)}`);
      if (error instanceof NotFoundException) {
        this.logger.warn(`Not found error in getCurrentCustomer: ${(error as Error).message}`, (error as Error).stack);
        throw error;
      }
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`Unauthorized error in getCurrentCustomer: ${(error as Error).message}`, (error as Error).stack);
        throw error;
      }
      this.logger.error(`Internal server error in getCurrentCustomer: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a customer by username' })
  @UseGuards(JwtAuthGuard)
  @Get(':username')
  async findOne(@Param('username') username: string): Promise<CustomerDocument> {
    try {
      this.logger.debug(`Finding customer with username: ${username}`);
      const customer = await this.customersService.findOne(username);
      if (!customer) {
        this.logger.warn(`Customer with username: ${username} not found`);
        throw createNotFoundError('Customer', username);
      }
      this.logger.debug(`Found customer: ${JSON.stringify(customer)}`);
      return customer;
    } catch (error: any) {
      this.logger.error(`Error finding customer with username: ${username}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    try {
      this.logger.debug(`Creating customer with username: ${createCustomerDto.username}`);
      const result = await this.customersService.createCustomer(createCustomerDto);
      this.logger.debug(`Customer created successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Error creating customer with username: ${createCustomerDto.username}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current customer' })
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: Partial<CustomerDocument>,
    @Req() req: JwtRequest,
  ): Promise<CustomerDocument> {
    const user = req.user;
    this.logger.debug(`Current user from JWT: ${JSON.stringify(user)}`);

    if (!user || !user.sub) {
      this.logger.warn('Unauthorized access attempt');
      throw new UnauthorizedException();
    }

    if (id !== user.sub) {
      this.logger.warn(`User with ID: ${user.sub} attempted to update another user's (id:  ${id} ) data`);
      throw new UnauthorizedException('You can only update your own data');
    }

    this.logger.debug(`Updating customer with ID: ${id}`);

    const customer = await this.customersService.updateCustomer(id, updateCustomerDto);
    if (!customer) {
      this.logger.warn(`Customer with ID: ${id} not found`);
      throw createNotFoundError('Customer', id);
    }

    this.logger.debug(`Updated customer details: ${JSON.stringify(customer)}`);
    return customer;
  }
}
