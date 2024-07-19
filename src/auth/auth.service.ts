
import * as bcrypt from 'bcrypt';

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomersService } from '../customers/customers.service';
import { JwtPayload } from './jwt-payload.interface';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { createNotFoundError, createUnauthorizedError } from '../common/utils/error.utils';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private readonly customersService: CustomersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateCustomer(username: string, pass: string): Promise<Omit<CustomerDocument, 'password'>> {
    try {
      const customer = (await this.customersService.findOne(username)) as CustomerDocument;
      if (!customer) {
        throw createNotFoundError('Customer', username);
      }
      const isPasswordValid = await bcrypt.compare(pass, customer.password);
      if (!isPasswordValid) {
        throw createUnauthorizedError('Invalid credentials');
      }
      const { password, ...result } = customer.toObject();
      return result as Omit<CustomerDocument, 'password'>;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async login(customer: Omit<CustomerDocument, 'password'>): Promise<{ access_token: string }> {
    try {
      const payload: JwtPayload = {
        username: customer.username,
        sub: (customer._id as Types.ObjectId).toHexString(),
      };
      return {
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  async validateCustomerByJwt(payload: JwtPayload): Promise<CustomerDocument> {
    try {
      const customer = (await this.customersService.findOne(payload.username)) as CustomerDocument;
      if (!customer) {
        throw createNotFoundError('Customer', payload.username);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }
}
