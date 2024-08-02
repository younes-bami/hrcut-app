import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { createNotFoundError, createConflictError, updateNotFoundError, updateConflictError } from '../common/utils/error.utils';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RegisterCustomerDto } from './dto/RegisterCustomer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  private async findCustomerByField(field: string, value: string): Promise<CustomerDocument | null> {
    this.logger.debug(`Finding customer by ${field}: ${value}`);
    try {
      const customer = await this.customerModel.findOne({ [field]: value }).exec();
      if (!customer) {
        this.logger.warn(`Customer with ${field}: ${value} not found`);
        throw createNotFoundError('Customer', value);
      }
      this.logger.debug(`Found customer: ${JSON.stringify(customer)}`);
      return customer;
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        this.logger.warn(`Customer with ${field}: ${value} not found`, (error as Error).message);
        throw error;
      }
      this.logger.error(`Error finding customer by ${field}: ${value}`, (error as Error).message);
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async findOne(username: string): Promise<CustomerDocument | null> {
    this.logger.debug(`Calling findCustomerByField with username: ${username}`);
    return this.findCustomerByField('username', username);
  }

  async findById(id: string): Promise<CustomerDocument | null> {
    try {
      const customer = await this.customerModel.findById(id).exec();
      if (!customer) {
        throw createNotFoundError('Customer', id);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  private async checkExistingCustomer(username: string, email: string) {
    const existingCustomerByEmail = await this.customerModel.findOne({ email }).exec();
    if (existingCustomerByEmail) {
      this.logger.warn(`Customer with email: ${email} already exists`);
      throw createConflictError('Customer with this email already exists');
    }

    const existingCustomerByUsername = await this.customerModel.findOne({ username }).exec();
    if (existingCustomerByUsername) {
      this.logger.warn(`Customer with username: ${username} already exists`);
      throw createConflictError('Customer with this username already exists');
    }
  }

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    await this.checkExistingCustomer(createCustomerDto.username, createCustomerDto.email);
    this.logger.debug(`Creating customer with email: ${createCustomerDto.email}`);

    const createdCustomer = new this.customerModel(createCustomerDto);
    this.logger.debug(`Customer to create: ${JSON.stringify(createdCustomer)}`);

    return await createdCustomer.save();
  }



  async updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerDocument> {
    try {
      const existingCustomer = await this.customerModel.findById(id).exec();
      if (!existingCustomer) {
        throw createNotFoundError('Customer', id);
      }

      if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
        const emailExists = await this.customerModel.findOne({ email: updateCustomerDto.email }).exec();
        if (emailExists) {
          throw updateConflictError('Customer with this email already exists');
        }
      }

      Object.assign(existingCustomer, updateCustomerDto);
      return await existingCustomer.save();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error updating customer: ${(error as Error).message}`, (error as Error).stack);
      throw new InternalServerErrorException((error as Error).message);
    }
  }
}
