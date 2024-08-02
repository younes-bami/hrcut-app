import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsMoroccanPhoneNumber } from './custom-validators'; // Assurez-vous que le chemin est correct

export class CreateCustomerDto {
  @ApiProperty({ example: '66aa164223c8c0ec25dd5be9', description: 'The ID of the user in the Auth microservice' })
  @IsString()
  @IsNotEmpty()
  authUserId!: string;  // ID de l'utilisateur dans le microservice Auth
  
  @ApiProperty({ example: 'john_doe', description: 'The username of the customer' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ example: 'John', description: 'The first name of the customer' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'The last name of the customer' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'The email of the customer' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: '+212600000000', description: 'The phone number of the customer' })
  @IsString()
  @IsNotEmpty()
  @IsMoroccanPhoneNumber() // Validation pour le numéro de téléphone marocain
  phoneNumber!: string;



}
