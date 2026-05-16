import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class MarkReadDto {
  @ApiProperty({ type: [String] }) @IsArray() @IsString({ each: true }) ids: string[];
}

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my notifications' })
  getNotifications(
    @CurrentUser() user: { id: string },
    @Query('limit') limit = 30,
    @Query('offset') offset = 0,
  ) {
    return this.notifications.getUserNotifications(user.id, +limit, +offset);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  markRead(@CurrentUser() user: { id: string }, @Body() dto: MarkReadDto) {
    return this.notifications.markNotificationsRead(user.id, dto.ids);
  }
}
