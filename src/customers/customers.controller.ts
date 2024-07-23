import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseInterceptors,
  UseGuards,
  Req,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomerDocument } from './schemas/customer.schema';
import { createNotFoundError, createUnauthorizedError } from '../common/utils/error.utils';
import { Component } from '../common/decorators/component.decorator';
import { ComponentInterceptor } from '../common/interceptors/component.interceptor';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UpdateCustomerDto } from './dto/update-customer.dto'; // Import the new DTO
import { JwtRequest } from '../common/types/custom';
import { ScopesGuard } from '../common/guards/scope.guards';
// src/customers/customers.controller.ts

@ApiTags('customers')
@UseInterceptors(ComponentInterceptor)
@Controller('customers')
@Component('CustomersController')
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly customersService: CustomersService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current customer' })
  @UseGuards(ScopesGuard)
  @Get('me')
  async getCurrentCustomer(@Req() req: JwtRequest): Promise<CustomerDocument> {
    const user = req.user;
    this.logger.debug(`Current user from JWT: ${JSON.stringify(user)}`);

    if (!user) {
      this.logger.warn('Unauthorized access attempt');
      throw new UnauthorizedException();
    }

    if (!user.username) {
      throw new UnauthorizedException('User does not have a valid username');
    }

    const customer = await this.customersService.findOne(user.username);
    if (!customer) {
      this.logger.warn(`Customer with username: ${user.username} not found`);
      throw new UnauthorizedException('Customer not found');
    }

    this.logger.debug(`Current customer details: ${JSON.stringify(customer)}`);
    return customer;
  }

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a customer by username' })
  @UseGuards(AuthGuard('jwt'))
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
    } catch (error: any) { // Changed 'unknown' to 'any'
      this.logger.error(`Error finding customer with username: ${username}`, error.stack);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }




  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update current customer' })
  @UseGuards(ScopesGuard)
  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: Partial<UpdateCustomerDto>,
    @Req() req: JwtRequest
  ): Promise<CustomerDocument> {
    const user = req.user;
    this.logger.debug(`Current user from JWT: ${JSON.stringify(user)}`);

    if (!user) {
      this.logger.warn('Unauthorized access attempt');
      throw new UnauthorizedException();
    }

    if (id !== user.sub) {
      this.logger.warn(`User with ID: ${user.sub} attempted to update another user's data`);
      throw new UnauthorizedException('You can only update your own data');
    }

    this.logger.debug(`Updating customer with ID: ${id}`);
    const customer = await this.customersService.updateCustomer(id, updateCustomerDto);

    if (!customer) {
      this.logger.warn(`Customer with ID: ${id} not found`);
      throw new UnauthorizedException('Customer not found');
    }

    this.logger.debug(`Updated customer details: ${JSON.stringify(customer)}`);
    return customer;
  }

  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    try {
      this.logger.debug(`Creating customer with username: ${createCustomerDto.username}`);
      const result = await this.customersService.createCustomer(createCustomerDto);
      this.logger.debug(`Customer created successfully: ${JSON.stringify(result)}`);
      return result;
    } catch (error: any) { // Changed 'unknown' to 'any'
      this.logger.error(`Error creating customer with username: ${createCustomerDto.username}`, error.stack);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

}