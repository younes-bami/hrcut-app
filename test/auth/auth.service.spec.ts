import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { CustomersService } from '../../src/customers/customers.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { CustomerDocument } from '../../src/customers/schemas/customer.schema';
import { NotFoundException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { createNotFoundError, createUnauthorizedError } from '../../src/common/utils/error.utils';
import { mockCustomer } from '../util/mock-customer-document';
import { Types } from 'mongoose';

interface CustomerModelMock {
  findOne: jest.Mock;
}

describe('AuthService', () => {
  let service: AuthService;
  let customersService: CustomersService;
  let jwtService: JwtService;
  let customerModel: CustomerModelMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CustomersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
          },
        },
        {
          provide: getModelToken('Customer'),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    customersService = module.get<CustomersService>(CustomersService);
    jwtService = module.get<JwtService>(JwtService);
    customerModel = module.get<CustomerModelMock>(getModelToken('Customer'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCustomer', () => {
    it('should validate a customer', async () => {
      customerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCustomer),
      });
      jest.spyOn(customersService, 'findOne').mockResolvedValue(mockCustomer as CustomerDocument);

      const result = await service.validateCustomer('john_doe', 'hashed_password_1');
      expect(result).toEqual({
        _id: mockCustomer._id,
        username: 'john_doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
        profilePicture: '',
        bio: 'Experienced hairdresser',
        location: 'New York, USA',
        preferredHairdresserId: '',
        servicesInterestedIn: ['cut', 'color', 'style'],
        bookingHistory: [],
        reviews: [],
        ratings: [5, 4, 5],
        isVerified: true,
        createdAt: mockCustomer.createdAt,
        updatedAt: mockCustomer.updatedAt,
      });
    });

    it('should throw NotFoundException if customer is not found', async () => {
      customerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      jest.spyOn(customersService, 'findOne').mockResolvedValue(null);

      await expect(service.validateCustomer('non_existent_user', 'hashed_password_1')).rejects.toThrow(createNotFoundError('Customer', 'non_existent_user'));
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const incorrectCustomer = { ...mockCustomer, password: 'hashed_password_2' };
      customerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(incorrectCustomer),
      });
      jest.spyOn(customersService, 'findOne').mockResolvedValue(incorrectCustomer as CustomerDocument);

      await expect(service.validateCustomer('john_doe', 'wrongpassword')).rejects.toThrow(createUnauthorizedError('Invalid credentials'));
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      customerModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });
      jest.spyOn(customersService, 'findOne').mockRejectedValue(new Error('Database error'));

      await expect(service.validateCustomer('john_doe', 'hashed_password_1')).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
    it('should return a JWT token', async () => {
      const { password, ...customerWithoutPassword } = mockCustomer;
      const result = await service.login(customerWithoutPassword as Omit<CustomerDocument, 'password'>);
      expect(result).toEqual({ access_token: 'test-token' });
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      const { password, ...customerWithoutPassword } = mockCustomer;
      jest.spyOn(jwtService, 'sign').mockImplementation(() => { throw new Error('Signing error'); });

      await expect(service.login(customerWithoutPassword as Omit<CustomerDocument, 'password'>)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('validateCustomerByJwt', () => {
    it('should validate a customer by JWT payload', async () => {
      customerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCustomer),
      });
      jest.spyOn(customersService, 'findOne').mockResolvedValue(mockCustomer as CustomerDocument);

      const result = await service.validateCustomerByJwt({ username: 'john_doe', sub: (mockCustomer._id as Types.ObjectId).toHexString() });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if customer is not found', async () => {
      customerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });
      jest.spyOn(customersService, 'findOne').mockResolvedValue(null);

      await expect(service.validateCustomerByJwt({ username: 'john_doe', sub: new Types.ObjectId().toHexString() })).rejects.toThrow(createNotFoundError('Customer', 'john_doe'));
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      customerModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });
      jest.spyOn(customersService, 'findOne').mockRejectedValue(new Error('Database error'));

      await expect(service.validateCustomerByJwt({ username: 'john_doe', sub: new Types.ObjectId().toHexString() })).rejects.toThrow(InternalServerErrorException);
    });
  });
});
