import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { UserBodyProfileService } from './user-body-profile.service';
import { CreateUserBodyProfileDto } from './dto/create-user-body-profile.dto';
import { UpdateUserBodyProfileDto } from './dto/update-user-body-profile.dto';
import { ApiKeyOrJwtAuthGuard } from '../auth/guards/api-key-or-jwt-auth.guard';

const profileExample = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  userId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
  heightCm: '170.50',
  weightKg: '65.00',
  dateOfBirth: '1995-04-01',
  gender: 'male',
  activityLevel: 'moderate',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

@ApiTags('User Body Profile')
@ApiBearerAuth('JWT-auth')
@ApiSecurity('X-API-Key')
@UseGuards(ApiKeyOrJwtAuthGuard)
@Controller('users/:userId/body-profile')
export class UserBodyProfileController {
  constructor(private readonly service: UserBodyProfileService) {}

  /**
   * POST /users/:userId/body-profile
   * Create a new body profile entry (history record) for a user
   */
  @Post()
  @ApiOperation({ summary: 'Create a new body profile entry for a user (supports history)' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
  @ApiBody({ type: CreateUserBodyProfileDto })
  @ApiResponse({ status: 201, description: 'Body profile entry created', schema: { example: profileExample } })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized – JWT token required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  create(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateUserBodyProfileDto,
  ) {
    return this.service.create(userId, dto);
  }

  /**
   * GET /users/:userId/body-profile
   * Get full body profile history of a user (ordered by latest)
   */
  @Get()
  @ApiOperation({ summary: 'Get body profile history of a user (array, ordered by latest)' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Body profile history (empty array if none)', schema: { example: [profileExample] } })
  @ApiResponse({ status: 401, description: 'Unauthorized – authentication required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findByUserId(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.service.findByUserId(userId);
  }

  /**
   * DELETE /users/:userId/body-profile/:profileId
   * Delete a specific body profile entry by its id
   */
  @Delete(':profileId')
  @ApiOperation({ summary: 'Delete a specific body profile entry by profileId' })
  @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
  @ApiParam({ name: 'profileId', type: 'string', format: 'uuid', description: 'Body profile entry UUID' })
  @ApiResponse({ status: 200, description: 'Body profile entry deleted', schema: { example: { message: 'Body profile uuid deleted successfully' } } })
  @ApiResponse({ status: 401, description: 'Unauthorized – JWT token required' })
  @ApiResponse({ status: 404, description: 'User or body profile entry not found' })
  remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
  ) {
    return this.service.remove(userId, profileId);
  }
}
