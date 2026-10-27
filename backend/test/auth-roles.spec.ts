import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/auth/auth.service.js';
import { UserEntity, UserRole } from '../src/user/entity/user.entity.js';
import { RolesGuard } from '../src/auth/guards/roles.guard.js';
import { GqlAuthGuard } from '../src/auth/guards/gql-auth.guard.js';
import { Reflector } from '@nestjs/core';
import { UnauthorizedException, ForbiddenException, ExecutionContext } from '@nestjs/common';

describe('Authentication & Role-Based Authorization Tests', () => {
  let authService: AuthService;
  let mockUserRepo: any;
  let usersDb: Map<string, UserEntity>;

  beforeEach(() => {
    usersDb = new Map();
    mockUserRepo = {
      findOne: async ({ where }: any) => {
        if (where.email) {
          return usersDb.get(where.email.toLowerCase()) || null;
        }
        if (where.id) {
          for (const u of usersDb.values()) {
            if (u.id === where.id) return u;
          }
        }
        return null;
      },
      save: async (user: UserEntity) => {
        if (!user.id) {
          user.id = usersDb.size + 1;
        }
        usersDb.set(user.email.toLowerCase(), user);
        return user;
      },
    };

    authService = new AuthService(mockUserRepo);
  });

  describe('Password Hashing & Token Security', () => {
    it('should securely hash password with unique salts and verify correctly', () => {
      const salt1 = authService.generateSalt();
      const salt2 = authService.generateSalt();
      expect(salt1).not.toBe(salt2);

      const hash1 = authService.hashPassword('admin123', salt1);
      const hash2 = authService.hashPassword('admin123', salt2);
      expect(hash1).not.toBe(hash2);

      expect(authService.verifyPassword('admin123', salt1, hash1)).toBe(true);
      expect(authService.verifyPassword('wrongPassword', salt1, hash1)).toBe(false);
    });

    it('should sign and verify valid JWT tokens', () => {
      const token = authService.signJwt({
        sub: 1,
        email: 'admin@aura.store',
        name: 'Elena Rostova',
        role: UserRole.ADMIN,
      });

      expect(typeof token).toBe('string');
      const payload = authService.verifyJwt(token);
      expect(payload.sub).toBe(1);
      expect(payload.email).toBe('admin@aura.store');
      expect(payload.role).toBe(UserRole.ADMIN);
    });

    it('should reject tampered or modified JWT tokens', () => {
      const token = authService.signJwt({
        sub: 1,
        email: 'customer@aura.store',
        name: 'Julian',
        role: UserRole.USER,
      });

      const parts = token.split('.');
      // Tamper payload to claim ADMIN
      const tamperedPayload = Buffer.from(
        JSON.stringify({ sub: 1, email: 'customer@aura.store', role: 'ADMIN' }),
      ).toString('base64url');
      const forgedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      expect(() => authService.verifyJwt(forgedToken)).toThrow(UnauthorizedException);
    });
  });

  describe('Registration & Public Account Enforcement', () => {
    it('public registration must strictly assign USER role and never ADMIN', async () => {
      const reg = await authService.register({
        name: 'New Customer',
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(reg.user.role).toBe(UserRole.USER);
      expect(reg.redirectUrl).toBe(process.env.CUSTOMER_URL || 'http://localhost:4000');

      const savedInDb = usersDb.get('newuser@example.com');
      expect(savedInDb?.role).toBe(UserRole.USER);
    });

    it('admin login directs to admin URL while customer login directs to customer URL', async () => {
      // Seed admin
      const saltAdmin = authService.generateSalt();
      const adminUser = new UserEntity();
      adminUser.name = 'Admin';
      adminUser.email = 'admin@aura.store';
      adminUser.salt = saltAdmin;
      adminUser.passwordHash = authService.hashPassword('admin123', saltAdmin);
      adminUser.role = UserRole.ADMIN;
      await mockUserRepo.save(adminUser);

      // Seed customer
      const saltCustomer = authService.generateSalt();
      const customerUser = new UserEntity();
      customerUser.name = 'Customer';
      customerUser.email = 'customer@aura.store';
      customerUser.salt = saltCustomer;
      customerUser.passwordHash = authService.hashPassword('customer123', saltCustomer);
      customerUser.role = UserRole.USER;
      await mockUserRepo.save(customerUser);

      const adminRes = await authService.login({
        email: 'admin@aura.store',
        password: 'admin123',
      });
      expect(adminRes.user.role).toBe(UserRole.ADMIN);
      expect(adminRes.redirectUrl).toBe(process.env.ADMIN_URL || 'http://localhost:4001');

      const customerRes = await authService.login({
        email: 'customer@aura.store',
        password: 'customer123',
      });
      expect(customerRes.user.role).toBe(UserRole.USER);
      expect(customerRes.redirectUrl).toBe(process.env.CUSTOMER_URL || 'http://localhost:4000');
    });
  });

  describe('Role-Based Guard Access Control', () => {
    let reflector: Reflector;
    let rolesGuard: RolesGuard;
    let gqlAuthGuard: GqlAuthGuard;

    beforeEach(() => {
      reflector = new Reflector();
      rolesGuard = new RolesGuard(reflector);
      gqlAuthGuard = new GqlAuthGuard(authService);
    });

    const createMockExecutionContext = (user?: any, authHeader?: string): ExecutionContext => {
      const req: any = {
        headers: authHeader ? { authorization: authHeader } : {},
        user,
      };

      return {
        getType: () => 'graphql',
        getHandler: () => ({}),
        getClass: () => ({}),
        getArgs: () => [{}, {}, { req }, {}],
        switchToHttp: () => ({
          getRequest: () => req,
        }),
      } as unknown as ExecutionContext;
    };

    it('GqlAuthGuard should throw UnauthorizedException when header is missing', () => {
      const ctx = createMockExecutionContext(undefined, undefined);
      expect(() => gqlAuthGuard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('GqlAuthGuard should populate req.user when valid Bearer token is provided', () => {
      const token = authService.signJwt({
        sub: 10,
        email: 'customer@aura.store',
        name: 'Julian Vance',
        role: UserRole.USER,
      });

      const ctx = createMockExecutionContext(undefined, `Bearer ${token}`);
      const canActivate = gqlAuthGuard.canActivate(ctx);
      expect(canActivate).toBe(true);

      const req = ctx.switchToHttp().getRequest();
      expect(req.user.sub).toBe(10);
      expect(req.user.role).toBe(UserRole.USER);
    });

    it('RolesGuard should block customer (USER) from accessing operations requiring ADMIN', () => {
      // Mock reflector returning ADMIN requirement
      reflector.getAllAndOverride = () => [UserRole.ADMIN];

      const customerUser = {
        sub: 5,
        email: 'customer@example.com',
        role: UserRole.USER,
      };

      const ctx = createMockExecutionContext(customerUser);
      expect(() => rolesGuard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('RolesGuard should grant access to administrator (ADMIN)', () => {
      reflector.getAllAndOverride = () => [UserRole.ADMIN];

      const adminUser = {
        sub: 1,
        email: 'admin@aura.store',
        role: UserRole.ADMIN,
      };

      const ctx = createMockExecutionContext(adminUser);
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });

    it('RolesGuard should allow all access when no roles are specified (public endpoints)', () => {
      reflector.getAllAndOverride = () => undefined;

      const unauthUser = undefined;
      const ctx = createMockExecutionContext(unauthUser);
      expect(rolesGuard.canActivate(ctx)).toBe(true);
    });
  });
});
