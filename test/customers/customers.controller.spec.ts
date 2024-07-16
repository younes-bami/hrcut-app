import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from '../../src/customers/customers.controller';
import { CustomersService } from '../../src/customers/customers.service';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { Customer, CustomerDocument } from '../../src/customers/schemas/customer.schema';
import { createUnauthorizedError } from '../../src/common/utils/error.utils';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { CreateCustomerDto } from '../../src/customers/dto/create-customer.dto';

describe('CustomersController', () => {
  let controller: CustomersController;
  let customersService: CustomersService;
  let authService: AuthService;

  const mockCustomer: Partial<CustomerDocument> = {
    _id: 'some-id',
    username: 'john_doe',
    password: 'hashed_password_1',
    firstName: 'Jane',
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

  const mockCustomersService = {
    findOne: jest.fn(),
    createCustomer: jest.fn(),
    registerCustomer: jest.fn().mockResolvedValue(mockCustomer),
  };

  const mockAuthService = {
    validateCustomer: jest.fn(),
    login: jest.fn().mockResolvedValue({ access_token: 'mockJwtToken' }),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mockJwtToken'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getModelToken(Customer.name),
          useValue: {}, // You can mock the model if needed
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    customersService = module.get<CustomersService>(CustomersService);
    authService = module.get<AuthService>(AuthService);
  });

  describe('findOne', () => {
    it('should return a customer if found', async () => {
      jest.spyOn(customersService, 'findOne').mockResolvedValue(mockCustomer as CustomerDocument);

      const result = await controller.findOne('john_doe');

      expect(customersService.findOne).toHaveBeenCalledWith('john_doe');
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException if customer not found', async () => {
      jest.spyOn(customersService, 'findOne').mockResolvedValue(null);

      await expect(controller.findOne('non_existent_user')).rejects.toThrow(NotFoundException);

      expect(customersService.findOne).toHaveBeenCalledWith('non_existent_user');
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const error = new Error('Unexpected error');
      jest.spyOn(customersService, 'findOne').mockRejectedValue(error);

      await expect(controller.findOne('john_doe')).rejects.toThrow(InternalServerErrorException);

      expect(customersService.findOne).toHaveBeenCalledWith('john_doe');
    });
  });

  describe('login', () => {
    it('should return a JWT token if credentials are valid', async () => {
      jest.spyOn(authService, 'validateCustomer').mockResolvedValue(mockCustomer as Omit<CustomerDocument, 'password'>);
      jest.spyOn(authService, 'login').mockResolvedValue({ access_token: 'mockJwtToken' });

      const loginDto: LoginDto = { username: 'john_doe', password: 'hashed_password_1' };
      const result = await controller.login(loginDto);

      expect(authService.validateCustomer).toHaveBeenCalledWith('john_doe', 'hashed_password_1');
      expect(authService.login).toHaveBeenCalledWith(mockCustomer);
      expect(result).toEqual({ access_token: 'mockJwtToken' });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      jest.spyOn(authService, 'validateCustomer').mockImplementation(() => {
        throw createUnauthorizedError('Invalid credentials');
      });

      const loginDto: LoginDto = { username: 'john_doe', password: 'wrong_password' };
      await expect(controller.login(loginDto)).rejects.toThrow(createUnauthorizedError('Invalid credentials'));

      expect(authService.validateCustomer).toHaveBeenCalledWith('john_doe', 'wrong_password');
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const error = new InternalServerErrorException('Unexpected error');
      jest.spyOn(authService, 'validateCustomer').mockRejectedValue(error);

      const loginDto: LoginDto = { username: 'john_doe', password: 'hashed_password_1' };
      await expect(controller.login(loginDto)).rejects.toThrow(InternalServerErrorException);

      expect(authService.validateCustomer).toHaveBeenCalledWith('john_doe', 'hashed_password_1');
    });
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createCustomerDto: CreateCustomerDto = {
        username: 'john_doe',
        password: 'hashed_password_1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
      };

      jest.spyOn(customersService, 'createCustomer').mockResolvedValue(mockCustomer as CustomerDocument);

      const result = await controller.create(createCustomerDto);

      expect(customersService.createCustomer).toHaveBeenCalledWith(createCustomerDto);
      expect(result).toEqual(mockCustomer);
    });

    it('should throw ConflictException if customer already exists', async () => {
      const createCustomerDto: CreateCustomerDto = {
        username: 'john_doe',
        password: 'hashed_password_1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
      };

      const conflictError = new ConflictException('Customer already exists');
      jest.spyOn(customersService, 'createCustomer').mockRejectedValue(conflictError);

      await expect(controller.create(createCustomerDto)).rejects.toThrow(conflictError);

      expect(customersService.createCustomer).toHaveBeenCalledWith(createCustomerDto);
    });

    it('should throw InternalServerErrorException for other errors', async () => {
      const createCustomerDto: CreateCustomerDto = {
        username: 'john_doe',
        password: 'hashed_password_1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '1234567890',
      };

      const error = new InternalServerErrorException('Unexpected error');
      jest.spyOn(customersService, 'createCustomer').mockRejectedValue(error);

      await expect(controller.create(createCustomerDto)).rejects.toThrow(InternalServerErrorException);

      expect(customersService.createCustomer).toHaveBeenCalledWith(createCustomerDto);
    });
  });

  
});
