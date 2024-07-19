import { Request } from 'express';

export interface JwtPayload {
  username: string;
  sub: string;
}

export interface User {
  userId: string;
}

export interface JwtRequest extends Request {
  user?: JwtPayload; // Ensure this matches with the JwtPayload type
}
