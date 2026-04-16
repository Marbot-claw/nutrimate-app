import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Optimized: Check both email and phone in a single query if both provided
    const conditions = [];
    if (createUserDto.email) conditions.push({ email: createUserDto.email });
    if (createUserDto.phone) conditions.push({ phone: createUserDto.phone });

    if (conditions.length > 0) {
      const existing = await this.usersRepository.findOne({ where: conditions });
      if (existing) {
        if (createUserDto.email && existing.email === createUserDto.email) {
          throw new ConflictException('Email already in use');
        }
        if (createUserDto.phone && existing.phone === createUserDto.phone) {
          throw new ConflictException('Phone number already in use');
        }
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
    // password stripping is handled by ClassSerializerInterceptor
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findAllPhones(): Promise<string[]> {
    const users = await this.usersRepository.find({
      where: { isActive: true },
      select: ['phone'],
    });
    return users.map((u) => u.phone).filter(Boolean);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    // Check conflicts for email/phone if they are being updated
    if (
      (updateUserDto.email && updateUserDto.email !== user.email) ||
      (updateUserDto.phone && updateUserDto.phone !== user.phone)
    ) {
      const conditions = [];
      if (updateUserDto.email && updateUserDto.email !== user.email)
        conditions.push({ email: updateUserDto.email });
      if (updateUserDto.phone && updateUserDto.phone !== user.phone)
        conditions.push({ phone: updateUserDto.phone });

      const existing = await this.usersRepository.findOne({ where: conditions });
      if (existing) {
        if (updateUserDto.email && existing.email === updateUserDto.email) {
          throw new ConflictException('Email already in use');
        }
        if (updateUserDto.phone && existing.phone === updateUserDto.phone) {
          throw new ConflictException('Phone number already in use');
        }
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    await this.usersRepository.update(id, updateUserDto);
    const updated = await this.usersRepository.findOne({ where: { id } });
    return updated!;
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    await this.usersRepository.delete(id);
    return { message: `User ${id} deleted successfully` };
  }
}
