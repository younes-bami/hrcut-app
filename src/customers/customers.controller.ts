import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  NotFoundException,
  InternalServerErrorException,
  UseInterceptors,
  UseGuards,
  UsePipes,
  ValidationPipe,
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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtRequest } from '../common/types/custom';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('customers')
@UseInterceptors(ComponentInterceptor)
@Controller('customers')
@Component('CustomersController')
export class CustomersController {
  private readonly logger = new Logger(CustomersController.name);

  constructor(private readonly customersService: CustomersService) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current customer' })
  @ApiResponse({status: 200,description: 'The current customer has been successfully retrieved.'})
  @ApiResponse({ status: 401, description: 'Unauthorized access attempt.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
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
  @ApiResponse({
    status: 200,
    description: 'The customer has been successfully retrieved.',})
  @ApiResponse({ status: 401, description: 'Unauthorized access attempt.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
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
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({type: CreateCustomerDto,description: 'The customer creation data'})
  @ApiResponse({status: 201,description: 'The customer has been successfully created.'})
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 409, description: 'Customer with this email, username, or phone number already exists.' })
  @UsePipes(new ValidationPipe({ transform: true }))
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
  @ApiBody({type: UpdateCustomerDto,description: 'The customer update data'})
  @ApiResponse({status: 200,description: 'The customer has been successfully updated.'})
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized access attempt.' })
  @ApiResponse({ status: 404, description: 'Customer not found.' })
  @ApiResponse({ status: 409, description: 'Customer with this email or phone number already exists.' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateCustomerDto: Partial<UpdateCustomerDto>,
    @Req() req: JwtRequest,
  ): Promise<CustomerDocument> {
    const user = req.user;
    this.logger.debug(`Current user from JWT: ${JSON.stringify(user)}`);

    if (!user || !user.sub) {
      this.logger.warn('Unauthorized access attempt');
      throw new UnauthorizedException();
    }

    this.logger.debug(`Updating customer with ID: ${id}`);

    const customer = await this.customersService.updateCustomer(id, user.sub, updateCustomerDto);
    if (!customer) {
      this.logger.warn(`Customer with ID: ${id} not found`);
      throw createNotFoundError('Customer', id);
    }

    this.logger.debug(`Updated customer details: ${JSON.stringify(customer)}`);
    return customer;
  }
}
