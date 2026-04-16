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
    const { email, phone, password } = createUserDto;

    // Check for existing user by email or phone in a single query for better performance
    const existingUser = await this.usersRepository.findOne({
      where: [
        ...(email ? [{ email }] : []),
        ...(phone ? [{ phone }] : []),
      ],
    });

    if (existingUser) {
      if (email && existingUser.email === email) {
        throw new ConflictException('Email already in use');
      }
      if (phone && existingUser.phone === phone) {
        throw new ConflictException('Phone number already in use');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
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
    return users.map((u) => u.phone).filter((p): p is string => !!p);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    const { email, phone, password } = updateUserDto;

    // Check conflicts if email or phone is being changed
    if ((email && email !== user.email) || (phone && phone !== user.phone)) {
      const existing = await this.usersRepository.findOne({
        where: [
          ...(email && email !== user.email ? [{ email }] : []),
          ...(phone && phone !== user.phone ? [{ phone }] : []),
        ],
      });

      if (existing) {
        if (email === existing.email) throw new ConflictException('Email already in use');
        if (phone === existing.phone) throw new ConflictException('Phone number already in use');
      }
    }

    if (password) {
      updateUserDto.password = await bcrypt.hash(password, 10);
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.usersRepository.delete(user.id);
    return { message: `User ${id} deleted successfully` };
  }
}
