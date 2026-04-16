import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserBodyProfile } from './entities/user-body-profile.entity';
import { CreateUserBodyProfileDto } from './dto/create-user-body-profile.dto';
import { UpdateUserBodyProfileDto } from './dto/update-user-body-profile.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserBodyProfileService {
  constructor(
    @InjectRepository(UserBodyProfile)
    private readonly profileRepository: Repository<UserBodyProfile>,
    private readonly usersService: UsersService,
  ) {}

  async create(
    userId: string,
    dto: CreateUserBodyProfileDto,
  ): Promise<UserBodyProfile> {
    // ensure user exists
    await this.usersService.findOne(userId);

    // One-to-Many: each entry is a new history record, no duplicate check
    const profile = this.profileRepository.create({ ...dto, userId });
    return this.profileRepository.save(profile);
  }

  async findByUserId(userId: string): Promise<UserBodyProfile[]> {
    // ensure user exists
    await this.usersService.findOne(userId);

    const profiles = await this.profileRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return profiles;
  }

  /**
   * Delete a specific body profile entry by its own id.
   */
  async remove(
    userId: string,
    profileId: string,
  ): Promise<{ message: string }> {
    // ensure user exists
    await this.usersService.findOne(userId);

    const profile = await this.profileRepository.findOne({
      where: { id: profileId, userId },
    });
    if (!profile) {
      throw new NotFoundException(
        `Body profile ${profileId} not found for user ${userId}`,
      );
    }

    await this.profileRepository.delete(profile.id);
    return { message: `Body profile ${profileId} deleted successfully` };
  }
}
