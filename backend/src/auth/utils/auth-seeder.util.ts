import type { Repository } from 'typeorm';
import type { Logger } from '@nestjs/common';
import { UserEntity, UserRole } from '../../user/entity/user.entity.js';
import { generateSalt, hashPassword } from './crypto.util.js';

/**
 * Initializes default administrator and demo customer accounts on a fresh database.
 */
export async function seedInitialUsers(
  userRepo: Repository<UserEntity>,
  logger: Logger
): Promise<void> {
  try {
    const adminEmail = 'admin@aura.store';
    const adminExists = await userRepo.findOne({ where: { email: adminEmail } });
    if (!adminExists) {
      const salt = generateSalt();
      const adminUser = new UserEntity();
      adminUser.name = 'Elena Rostova';
      adminUser.email = adminEmail;
      adminUser.salt = salt;
      adminUser.passwordHash = hashPassword('admin123', salt);
      adminUser.role = UserRole.ADMIN;
      adminUser.avatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
      await userRepo.save(adminUser);
      logger.log(`Initialized default administrator account: ${adminEmail}`);
    } else if (adminExists.role !== UserRole.ADMIN) {
      adminExists.role = UserRole.ADMIN;
      await userRepo.save(adminExists);
      logger.log(`Ensured administrator privileges for: ${adminEmail}`);
    }

    const customerEmail = 'customer@aura.store';
    const customerExists = await userRepo.findOne({ where: { email: customerEmail } });
    if (!customerExists) {
      const salt = generateSalt();
      const customerUser = new UserEntity();
      customerUser.name = 'Julian Vance';
      customerUser.email = customerEmail;
      customerUser.salt = salt;
      customerUser.passwordHash = hashPassword('customer123', salt);
      customerUser.role = UserRole.USER;
      customerUser.avatar = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80';
      await userRepo.save(customerUser);
      logger.log(`Initialized default customer account: ${customerEmail}`);
    }
  } catch (err: any) {
    logger.warn(`User seeding note: ${err?.message || err}`);
  }
}
