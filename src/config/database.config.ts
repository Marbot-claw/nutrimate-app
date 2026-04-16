import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UserBodyProfile } from '../user-body-profile/entities/user-body-profile.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'nutrimate-db'),
    entities: [User, UserBodyProfile],
    // Only synchronize in non-production environments to prevent accidental data loss
    synchronize: isProduction
      ? false
      : configService.get<string>('DB_SYNC', 'true') === 'true',
    logging: configService.get<string>('DB_LOGGING', 'true') === 'true',
    ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
  };
};
