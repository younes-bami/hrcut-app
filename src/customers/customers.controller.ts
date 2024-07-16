import { Controller, Get,Post, Body, Param, NotFoundException, BadRequestException, InternalServerErrorException, UseInterceptors, UseGuards, ConflictException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { AuthService } from '../auth/auth.service';
import { CustomerDocument } from './schemas/customer.schema';
import { createNotFoundError, createUnauthorizedError } from '../common/utils/error.utils';
import { Component } from '../common/decorators/component.decorator';
import { ComponentInterceptor } from '../common/interceptors/component.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from '../auth/dto/login.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RegisterCustomerDto } from './dto/RegisterCustomer.dto';



@ApiTags('customers')
@UseInterceptors(ComponentInterceptor)
@Controller('customers')
@Component('CustomersController')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly authService: AuthService
  ) {}

  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a customer by username' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':username')
  async findOne(@Param('username') username: string): Promise<CustomerDocument> {
    try {
      const customer = await this.customersService.findOne(username);
      if (!customer) {
        throw createNotFoundError('Customer', username);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const customer = await this.authService.validateCustomer(loginDto.username, loginDto.password);
    if (!customer) {
      throw createUnauthorizedError('Invalid credentials');
    }
    return this.authService.login(customer);
  }

  @Post()
  async create(@Body() createCustomerDto: CreateCustomerDto) {
    try {
      return await this.customersService.createCustomer(createCustomerDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  @Post('register')
  async register(@Body() registerCustomerDto: RegisterCustomerDto) {
    try {
      return await this.customersService.registerCustomer(registerCustomerDto);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }
}