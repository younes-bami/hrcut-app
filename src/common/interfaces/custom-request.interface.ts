// common/interfaces/custom-request.interface.ts
import { Request } from 'express';
import { JwtPayload } from './jwt-payload.interface';

export interface CustomRequest extends Request {
  user?: JwtPayload;
}
