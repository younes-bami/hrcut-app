import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { createNotFoundError, createConflictError, createUnauthorizedError, updateNotFoundError, updateConflictError } from '../common/utils/error.utils';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { RegisterCustomerDto } from './dto/RegisterCustomer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {}

  private async findCustomerByField(field: string, value: string): Promise<CustomerDocument | null> {
    try {
      const customer = await this.customerModel.findOne({ [field]: value }).exec();
      if (!customer) {
        throw createNotFoundError('Customer', value);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async findOne(username: string): Promise<CustomerDocument | null> {
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
      throw createConflictError('Customer with this email already exists');
    }

    const existingCustomerByUsername = await this.customerModel.findOne({ username }).exec();
    if (existingCustomerByUsername) {
      throw createConflictError('Customer with this username already exists');
    }
  }

  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    await this.checkExistingCustomer(createCustomerDto.username, createCustomerDto.email);

    const createdCustomer = new this.customerModel(createCustomerDto);
    return await createdCustomer.save();
  }

  async registerCustomer(registerCustomerDto: RegisterCustomerDto): Promise<CustomerDocument> {
    await this.checkExistingCustomer(registerCustomerDto.username, registerCustomerDto.email);

    const hashedPassword = await bcrypt.hash(registerCustomerDto.password, 10);
    const newCustomer = new this.customerModel({
      ...registerCustomerDto,
      password: hashedPassword,
    });

    return await newCustomer.save();
  }
  async updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerDocument> {
    try {
      const existingCustomer = await this.customerModel.findById(id).exec();
      if (!existingCustomer) {
        throw updateNotFoundError('Customer', id);
      }

      if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) { //ne pas oublier le telephone aussi 
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
      throw new InternalServerErrorException((error as Error).message);
    }
  }
}
