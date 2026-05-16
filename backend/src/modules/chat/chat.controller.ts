import {
  Controller, Get, Post, Param, Query, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('chat')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get paginated chat messages for a room' })
  getMessages(
    @CurrentUser() user: { id: string },
    @Param('roomId') roomId: string,
    @Query('limit') limit = 50,
    @Query('before') before?: string,
  ) {
    return this.chat.getChatMessages(roomId, user.id, +limit, before);
  }

  @Post('rooms/:roomId/media')
  @UseInterceptors(FileInterceptor('media'))
  @ApiOperation({ summary: 'Upload image/voice note to chat' })
  uploadMedia(
    @CurrentUser() user: { id: string },
    @Param('roomId') roomId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chat.uploadChatMedia(roomId, user.id, file);
  }

  @Post('rooms/ride/:rideId')
  @ApiOperation({ summary: 'Get or create chat room for a ride' })
  getRideChat(@Param('rideId') rideId: string) {
    return this.chat.getOrCreateChatRoom(rideId);
  }

  @Post('rooms/errand/:errandId')
  @ApiOperation({ summary: 'Get or create chat room for an errand' })
  getErrandChat(@Param('errandId') errandId: string) {
    return this.chat.getOrCreateChatRoom('', errandId);
  }
}
