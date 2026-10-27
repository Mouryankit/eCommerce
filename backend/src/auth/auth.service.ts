import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../user/entity/user.entity.js';
import { LoginInput, RegisterInput } from './args/auth.args.js';
import { AuthResponse } from './schema/user.schema.js';
import {
  JwtPayload,
  hashPassword,
  generateSalt,
  verifyPassword,
  signJwt,
  verifyJwt,
} from './utils/crypto.util.js';
import { seedInitialUsers } from './utils/auth-seeder.util.js';

export type { JwtPayload };

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'ecommerce-super-secret-jwt-key-2026';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  private getRedirectUrl(role: UserRole): string {
    const isProd = process.env.NODE_ENV === 'production';
    if (role === UserRole.ADMIN) {
      if (process.env.ADMIN_URL && !process.env.ADMIN_URL.includes('localhost')) {
        return process.env.ADMIN_URL;
      }
      return isProd ? '/admin.html' : (process.env.ADMIN_URL || 'http://localhost:4001');
    }

    if (process.env.CUSTOMER_URL && !process.env.CUSTOMER_URL.includes('localhost')) {
      return process.env.CUSTOMER_URL;
    }
    return isProd ? '/' : (process.env.CUSTOMER_URL || 'http://localhost:4000');
  }

  async onModuleInit() {
    await seedInitialUsers(this.userRepo, this.logger);
  }

  // --- Password Hashing & Verification (Delegates to crypto.util) ---
  hashPassword(password: string, salt: string): string {
    return hashPassword(password, salt);
  }

  generateSalt(): string {
    return generateSalt();
  }

  verifyPassword(password: string, salt: string, hash: string): boolean {
    return verifyPassword(password, salt, hash);
  }

  // --- RFC 7519 JWT Standard using HMAC-SHA256 ---
  signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSeconds: number = 7 * 24 * 3600): string {
    return signJwt(payload, this.jwtSecret, expiresInSeconds);
  }

  verifyJwt(token: string): JwtPayload {
    return verifyJwt(token, this.jwtSecret);
  }

  // --- Authentication Flows ---
  async login(input: LoginInput): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const user = await this.userRepo.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = this.verifyPassword(input.password, user.salt, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Auto-promote designated admin emails if they previously held customer status
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@aura.store')
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const isDesignatedAdmin = adminEmails.includes(email) || email.startsWith('admin@');
    if (isDesignatedAdmin && user.role !== UserRole.ADMIN) {
      user.role = UserRole.ADMIN;
      await this.userRepo.save(user);
    }

    const token = this.signJwt({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const redirectUrl = this.getRedirectUrl(user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      redirectUrl,
    };
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const email = input.email.trim().toLowerCase();
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    if (input.password.length < 6) {
      throw new UnauthorizedException('Password must be at least 6 characters long');
    }

    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(input.password, salt);

    // Designated admin emails get ADMIN role automatically
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@aura.store')
      .split(',')
      .map((e) => e.trim().toLowerCase());
    const isDesignatedAdmin = adminEmails.includes(email) || email.startsWith('admin@');

    const user = new UserEntity();
    user.name = input.name.trim();
    user.email = email;
    user.salt = salt;
    user.passwordHash = passwordHash;
    user.role = isDesignatedAdmin ? UserRole.ADMIN : UserRole.USER;
    user.avatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`;

    const savedUser = await this.userRepo.save(user);

    const token = this.signJwt({
      sub: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
    });

    return {
      token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        avatar: savedUser.avatar,
      },
      redirectUrl: this.getRedirectUrl(savedUser.role),
    };
  }

  async promoteUserToAdmin(email: string): Promise<boolean> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.userRepo.findOne({ where: { email: cleanEmail } });
    if (!user) {
      throw new NotFoundException(`User with email "${cleanEmail}" not found`);
    }
    user.role = UserRole.ADMIN;
    await this.userRepo.save(user);
    this.logger.log(`Promoted user "${cleanEmail}" to ADMIN.`);
    return true;
  }

  async validateUserById(id: number): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
}
