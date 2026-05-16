import {
  Controller, Get, Patch, Post, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, SavedLocationDto, UpdateFcmTokenDto } from './dto/users.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: { id: string }) {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload profile avatar' })
  uploadAvatar(@CurrentUser() user: { id: string }, @UploadedFile() file: Express.Multer.File) {
    return this.users.uploadAvatar(user.id, file);
  }

  @Post('me/fcm-token')
  @ApiOperation({ summary: 'Register FCM push notification token' })
  updateFcmToken(@CurrentUser() user: { id: string }, @Body() dto: UpdateFcmTokenDto) {
    return this.users.updateFcmToken(user.id, dto);
  }

  @Get('me/locations')
  @ApiOperation({ summary: 'Get saved locations' })
  getSavedLocations(@CurrentUser() user: { id: string }) {
    return this.users.getSavedLocations(user.id);
  }

  @Post('me/locations')
  @ApiOperation({ summary: 'Save a new location' })
  saveLocation(@CurrentUser() user: { id: string }, @Body() dto: SavedLocationDto) {
    return this.users.saveLocation(user.id, dto);
  }

  @Delete('me/locations/:id')
  @ApiOperation({ summary: 'Delete a saved location' })
  deleteLocation(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.users.deleteLocation(user.id, id);
  }

  @Get('me/rides')
  @ApiOperation({ summary: 'Get ride history' })
  getRideHistory(
    @CurrentUser() user: { id: string },
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    return this.users.getRideHistory(user.id, +limit, +offset);
  }

  @Get('me/errands')
  @ApiOperation({ summary: 'Get errand history' })
  getErrandHistory(
    @CurrentUser() user: { id: string },
    @Query('limit') limit = 20,
    @Query('offset') offset = 0,
  ) {
    return this.users.getErrandHistory(user.id, +limit, +offset);
  }
}
