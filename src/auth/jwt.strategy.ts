import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { JwtPayload } from './jwt-payload.interface';
import { ConfigService } from '@nestjs/config';
import { createUnauthorizedError } from '../common/utils/error.utils'; // Import des utilitaires d'erreur


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService // Injection de ConfigService
  ) {
    const secretKey = configService.get<string>('JWT_SECRET');
    //console.log('JWT_SECRET in JwtStrategy:', secretKey); // Log de la clé secrète
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secretKey, // Utilisation de ConfigService pour obtenir JWT_SECRET
    });
  }

  async validate(payload: JwtPayload) {
    //console.log('Validating payload:', payload); // Ajoutez un log pour le payload
    const customer = await this.authService.validateCustomerByJwt(payload);
    if (!customer) {
     // console.log('Customer not found or not authorized'); // Log pour débogage
     throw createUnauthorizedError(); // Utilisation de la fonction utilitaire pour les erreurs non autorisées
    }
    return customer;
  }
}
