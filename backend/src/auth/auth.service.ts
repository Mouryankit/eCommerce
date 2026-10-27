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
  scryptSync,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from 'node:crypto';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
  exp: number;
  iat: number;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret = process.env.JWT_SECRET || 'ecommerce-super-secret-jwt-key-2026';
  private readonly adminUrl = process.env.ADMIN_URL || 'http://localhost:4001';
  private readonly customerUrl = process.env.CUSTOMER_URL || 'http://localhost:4000';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async onModuleInit() {
    await this.seedInitialUsers();
  }

  // --- Password Hashing & Verification (OWASP scrypt standard) ---
  hashPassword(password: string, salt: string): string {
    return scryptSync(password, salt, 64).toString('hex');
  }

  generateSalt(): string {
    return randomBytes(16).toString('hex');
  }

  verifyPassword(password: string, salt: string, hash: string): boolean {
    const inputHash = this.hashPassword(password, salt);
    try {
      return timingSafeEqual(
        Buffer.from(inputHash, 'hex'),
        Buffer.from(hash, 'hex'),
      );
    } catch {
      return false;
    }
  }

  // --- RFC 7519 JWT Standard using HMAC-SHA256 ---
  signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresInSeconds: number = 7 * 24 * 3600): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresInSeconds;
    const fullPayload: JwtPayload = { ...payload, iat, exp };

    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const signature = createHmac('sha256', this.jwtSecret)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');

    return `${b64Header}.${b64Payload}.${signature}`;
  }

  verifyJwt(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed authentication token');
    }

    const [b64Header, b64Payload, signature] = parts;
    const expectedSignature = createHmac('sha256', this.jwtSecret)
      .update(`${b64Header}.${b64Payload}`)
      .digest('base64url');

    let isValid = false;
    try {
      isValid = timingSafeEqual(
        Buffer.from(signature, 'utf8'),
        Buffer.from(expectedSignature, 'utf8'),
      );
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const payload: JwtPayload = JSON.parse(
      Buffer.from(b64Payload, 'base64url').toString('utf8'),
    );

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new UnauthorizedException('Authentication token has expired');
    }

    return payload;
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

    const redirectUrl =
      user.role === UserRole.ADMIN ? this.adminUrl : this.customerUrl;

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
      redirectUrl: savedUser.role === UserRole.ADMIN ? this.adminUrl : this.customerUrl,
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

  // --- Initial Admin & Demo User Seeding ---
  private async seedInitialUsers() {
    try {
      const adminEmail = 'admin@aura.store';
      const adminExists = await this.userRepo.findOne({ where: { email: adminEmail } });
      if (!adminExists) {
        const salt = this.generateSalt();
        const adminUser = new UserEntity();
        adminUser.name = 'Elena Rostova';
        adminUser.email = adminEmail;
        adminUser.salt = salt;
        adminUser.passwordHash = this.hashPassword('admin123', salt);
        adminUser.role = UserRole.ADMIN;
        adminUser.avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
        await this.userRepo.save(adminUser);
        this.logger.log(`Initialized default administrator account: ${adminEmail}`);
      } else if (adminExists.role !== UserRole.ADMIN) {
        adminExists.role = UserRole.ADMIN;
        await this.userRepo.save(adminExists);
        this.logger.log(`Ensured administrator privileges for: ${adminEmail}`);
      }

      const customerEmail = 'customer@aura.store';
      const customerExists = await this.userRepo.findOne({ where: { email: customerEmail } });
      if (!customerExists) {
        const salt = this.generateSalt();
        const customerUser = new UserEntity();
        customerUser.name = 'Julian Vance';
        customerUser.email = customerEmail;
        customerUser.salt = salt;
        customerUser.passwordHash = this.hashPassword('customer123', salt);
        customerUser.role = UserRole.USER;
        customerUser.avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
        await this.userRepo.save(customerUser);
        this.logger.log(`Initialized default customer account: ${customerEmail}`);
      }
    } catch (err: any) {
      this.logger.warn(`User seeding note: ${err?.message || err}`);
    }
  }
}
