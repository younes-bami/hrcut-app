import { Injectable, NotFoundException, InternalServerErrorException , ConflictException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { createNotFoundError, createConflictError } from '../common/utils/error.utils';
import { CreateCustomerDto } from './dto/create-customer.dto';
import {RegisterCustomerDto} from './dto/RegisterCustomer.dto';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer.name) private customerModel: Model<CustomerDocument>, 

) {}

  async findOne(username: string): Promise<CustomerDocument | null> {
    try {
      const customer = await this.customerModel.findOne({ username }).exec();
      if (!customer) {
        throw createNotFoundError('Customer', username);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Laisser passer NotFoundException
      }
      if (error instanceof Error) {
        throw new InternalServerErrorException(error.message);
      } else {
        throw new InternalServerErrorException((error as Error).message);
      }
    }
  }


  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<CustomerDocument> {
    try {
      console.log('Checking if customer already exists'); // Log for debugging
      //const existingCustomer = await this.customerModel.findOne({ username: createCustomerDto.username });
      const existingCustomer = await this.customerModel.findOne({ username: createCustomerDto.username }).exec();

      if (existingCustomer) {
        console.log('Customer already exists'); // Log for debugging
        throw createConflictError('Customer with this username already exists');
      }

      console.log('Creating new customer'); // Log for debugging
      const createdCustomer = new this.customerModel(createCustomerDto);

      const savedCustomer = await createdCustomer.save();
      console.log('Customer created successfully', savedCustomer); // Log for debugging
      return savedCustomer;
    } catch (error) {
      //console.error('Error in createCustomer:', error); // Log for debugging
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async registerCustomer(registerCustomerDto: RegisterCustomerDto): Promise<Customer> {
    const existingCustomerByEmail = await this.customerModel.findOne({ email: registerCustomerDto.email }).exec();
    if (existingCustomerByEmail) {
      throw new ConflictException('Customer with this email already exists');
    }

    const existingCustomerByUsername = await this.customerModel.findOne({ username: registerCustomerDto.username }).exec();
    if (existingCustomerByUsername) {
      throw new ConflictException('Customer with this username already exists');
    }

    const newCustomer = new this.customerModel(registerCustomerDto);
    return await newCustomer.save();
  }
}