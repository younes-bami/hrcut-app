import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CustomersService } from '../../src/customers/customers.service';
import { Customer, CustomerDocument } from '../../src/customers/schemas/customer.schema';
import { createNotFoundError, createConflictError } from '../../src/common/utils/error.utils';
import { InternalServerErrorException } from '@nestjs/common';
import { CreateCustomerDto } from '../../src/customers/dto/create-customer.dto';
import { Model } from 'mongoose';

// Mock class to simulate Customer model
class MockCustomerModel {
  constructor(private data: any) {}

  save = jest.fn().mockResolvedValue(this.data);
  toObject = jest.fn().mockReturnValue(this.data);

  static findOne = jest.fn();
  static create = jest.fn().mockImplementation((data) => new MockCustomerModel(data));
  static exec = jest.fn().mockReturnValue(this);
  static select = jest.fn().mockReturnThis();
}

describe('CustomersService', () => {
  let service: CustomersService;
  let customerModel: typeof MockCustomerModel;

  const mockCustomer = {
    _id: 'some-id',
    username: 'john_doe',
    password: 'hashed_password_1',
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
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getModelToken(Customer.name),
          useValue: MockCustomerModel,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    customerModel = module.get<typeof MockCustomerModel>(getModelToken(Customer.name));
  });

  describe('findOne', () => {
    it('should find a customer by username', async () => {
      MockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCustomer),
      });

      const result = await service.findOne(mockCustomer.username);

      expect(MockCustomerModel.findOne).toHaveBeenCalledWith({ username: mockCustomer.username });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      MockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('non_existent_user')).rejects.toThrow(createNotFoundError('Customer', 'non_existent_user'));

      expect(MockCustomerModel.findOne).toHaveBeenCalledWith({ username: 'non_existent_user' });
    });

    it('should throw InternalServerErrorException for database errors', async () => {
      MockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      await expect(service.findOne('john_doe')).rejects.toThrow(InternalServerErrorException);

      expect(MockCustomerModel.findOne).toHaveBeenCalledWith({ username: 'john_doe' });
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      MockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const createCustomerDto: CreateCustomerDto = {
        username: 'john_doe',
        password: 'hashed_password_1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
      };

      const result = await service.createCustomer(createCustomerDto);
      expect(result).toEqual(expect.objectContaining(createCustomerDto));
    });

    it('should throw ConflictException if customer already exists', async () => {
      MockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockCustomer),
      });

      const createCustomerDto: CreateCustomerDto = {
        username: 'john_doe',
        password: 'hashed_password_1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
      };

      await expect(service.createCustomer(createCustomerDto)).rejects.toThrow(createConflictError('Customer with this username already exists'));
    });

    it('should throw InternalServerErrorException on unexpected error', async () => {
      MockCustomerModel.findOne.mockReturnValue({
        exec: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const createCustomerDto: CreateCustomerDto = {
        username: 'john_doe',
        password: 'hashed_password_1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
      };

      await expect(service.createCustomer(createCustomerDto)).rejects.toThrow(InternalServerErrorException);
    });
  });
});
