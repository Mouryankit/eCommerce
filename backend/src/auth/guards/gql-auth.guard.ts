import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthService } from '../auth.service.js';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext()?.req || context.switchToHttp().getRequest();

    if (!req) {
      throw new UnauthorizedException('Request context unavailable');
    }

    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    let token: string | null = null;

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      } else {
        throw new UnauthorizedException('Invalid Authorization header format. Expected "Bearer <token>"');
      }
    } else if (req.headers?.cookie) {
      // Extract from cookies (aura_token or token)
      const cookieHeader = req.headers.cookie as string;
      const match = cookieHeader.match(/(?:^|;\s*)(?:aura_token|token)=([^;]*)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token missing. Please log in.');
    }

    try {
      const payload = this.authService.verifyJwt(token);
      req.user = payload;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Authentication failed');
    }
  }
}
