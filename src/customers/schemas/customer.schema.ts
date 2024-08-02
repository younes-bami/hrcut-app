import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Customer {

  @Prop({ required: false })
  authUserId!: string;  // ID de l'utilisateur dans le microservice Auth

  @Prop({ required: true })
  username!: string;

//  @Prop({ required: true })
//  password!: string;

  @Prop({ required: true })
  firstName!: string;

  @Prop({ required: true })
  lastName!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  phoneNumber!: string;

  @Prop()
  profilePicture?: string;

  @Prop()
  bio?: string;

  @Prop()
  location?: string;

  @Prop()
  preferredHairdresserId?: string;

  @Prop([String])
  servicesInterestedIn?: string[];

  @Prop([String])
  bookingHistory?: string[];

  @Prop([String])
  reviews?: string[];

  @Prop([Number])
  ratings?: number[];

  @Prop({ default: false })
  isVerified!: boolean;

  @Prop({ default: Date.now })
  createdAt!: Date;

  @Prop({ default: Date.now })
  updatedAt!: Date;
}

export type CustomerDocument = Customer & Document;
export const CustomerSchema = SchemaFactory.createForClass(Customer);
