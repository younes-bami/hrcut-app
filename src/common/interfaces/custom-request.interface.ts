import { Request } from 'express';
import { JwtPayload } from './jwt-payload.interface'; // Assurez-vous que le chemin est correct

export interface JwtRequest extends Request {
  user?: JwtPayload; // Assurez-vous que le type JwtPayload est correctement défini et importé
}
