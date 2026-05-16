import {
  Controller, Get, Post, Patch, Param, Body,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RidersService } from './riders.service';
import { ToggleOnlineDto, UpdateLocationDto, UpdateRiderFcmDto } from './dto/riders.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('riders')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('riders')
export class RidersController {
  constructor(private riders: RidersService) {}

  @Get('me/dashboard')
  @Roles(UserRole.TRANSPORT_RIDER, UserRole.ERRANDS_RIDER)
  @ApiOperation({ summary: 'Rider dashboard — earnings, stats, wallet' })
  getDashboard(@CurrentUser() user: { id: string }) {
    return this.riders.getDashboard(user.id);
  }

  @Get('me/profile')
  @Roles(UserRole.TRANSPORT_RIDER, UserRole.ERRANDS_RIDER)
  @ApiOperation({ summary: 'Get my rider profile' })
  getMyProfile(@CurrentUser() user: { id: string }) {
    return this.riders.getRiderByUserId(user.id);
  }

  @Patch('me/online')
  @Roles(UserRole.TRANSPORT_RIDER, UserRole.ERRANDS_RIDER)
  @ApiOperation({ summary: 'Toggle online/offline status' })
  toggleOnline(@CurrentUser() user: { id: string }, @Body() dto: ToggleOnlineDto) {
    return this.riders.toggleOnline(user.id, dto);
  }

  @Patch('me/location')
  @Roles(UserRole.TRANSPORT_RIDER, UserRole.ERRANDS_RIDER)
  @ApiOperation({ summary: 'Update current GPS location' })
  updateLocation(@CurrentUser() user: { id: string }, @Body() dto: UpdateLocationDto) {
    return this.riders.updateLocation(user.id, dto);
  }

  @Post('me/fcm-token')
  @Roles(UserRole.TRANSPORT_RIDER, UserRole.ERRANDS_RIDER)
  @ApiOperation({ summary: 'Register FCM push token' })
  updateFcmToken(@CurrentUser() user: { id: string }, @Body() dto: UpdateRiderFcmDto) {
    return this.riders.updateFcmToken(user.id, dto);
  }

  @Post('me/documents/:docType')
  @Roles(UserRole.TRANSPORT_RIDER, UserRole.ERRANDS_RIDER)
  @UseInterceptors(FileInterceptor('document'))
  @ApiOperation({ summary: 'Upload verification document (id, license, vehicle_photo)' })
  uploadDocument(
    @CurrentUser() user: { id: string },
    @Param('docType') docType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.riders.uploadDocument(user.id, docType, file);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public rider profile by ID' })
  getRiderProfile(@Param('id') id: string) {
    return this.riders.getRiderProfile(id);
  }
}
