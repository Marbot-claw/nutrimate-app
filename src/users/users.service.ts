import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const { email, phone, password, ...rest } = createUserDto;

    if (email) {
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (existing) throw new ConflictException('Email already in use');
    }

    if (phone) {
      const existingPhone = await this.usersRepository.findOne({ where: { phone } });
      if (existingPhone) throw new ConflictException('Phone number already in use');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const user = this.usersRepository.create({
      ...rest,
      email,
      phone,
      password: hashedPassword,
    });

    const saved = await this.usersRepository.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.usersRepository.find();
    return users.map(({ password: _, ...rest }) => rest);
  }

  async findOne(id: string): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    const { password: _, ...result } = user;
    return result;
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

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const { email, phone, password, ...rest } = updateUserDto;

    if (email && email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email } });
      if (existing) throw new ConflictException('Email already in use');
    }

    if (phone && phone !== user.phone) {
      const existing = await this.usersRepository.findOne({ where: { phone } });
      if (existing) throw new ConflictException('Phone number already in use');
    }

    const updateData: any = { ...rest };
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (password) {
      updateData.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    }

    await this.usersRepository.update(id, updateData);
    
    // Fetch updated user
    const updated = await this.usersRepository.findOneBy({ id });
    const { password: _, ...result } = updated!;
    return result;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return { message: `User ${id} deleted successfully` };
  }
}
