import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UserBodyProfile } from '../user-body-profile/entities/user-body-profile.entity';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';

  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_NAME', 'nutrimate-db'),
    entities: [User, UserBodyProfile],
    // NEVER use synchronize: true in production - it can cause data loss
    synchronize: configService.get<string>('DB_SYNC') === 'true' || (!isProduction && configService.get<string>('DB_SYNC') !== 'false'),
    logging: configService.get<string>('DB_LOGGING', 'true') === 'true',
    // SSL configuration for production databases (like AWS RDS or Heroku)
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
};
