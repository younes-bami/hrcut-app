// src/customers/dto/update-customer.dto.ts
import { IsString, IsOptional, IsEmail } from 'class-validator';
import { IsMoroccanPhoneNumber } from './custom-validators';


export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsMoroccanPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  preferredHairdresserId?: string;

  // Add other fields as necessary
}
