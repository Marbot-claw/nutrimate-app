import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create({
      phone: registerDto.phone,
      password: registerDto.password,
      name: registerDto.name,
      role: UserRole.USER,
    });

    const token = this.generateToken(user.id, user.phone || '', user.role);

    return {
      message: 'Registration successful',
      user,
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByPhone(loginDto.phone);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const token = this.generateToken(user.id, user.phone || '', user.role);

    return {
      message: 'Login successful',
      user,
      access_token: token,
    };
  }

  private generateToken(userId: string, phone: string, role: string): string {
    const payload = { sub: userId, phone, role };
    return this.jwtService.sign(payload);
  }
}
