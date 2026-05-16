import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class InitiateCallDto {
  @ApiProperty() @IsString() targetUserId: string;
  @ApiPropertyOptional() @IsString() @IsOptional() rideId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() errandId?: string;
}

class EndCallDto {
  @ApiProperty() @IsNumber() durationSeconds: number;
}

@ApiTags('calls')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private calls: CallsService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initiate an in-app voice call (returns Agora tokens)' })
  initiateCall(@CurrentUser() user: { id: string }, @Body() dto: InitiateCallDto) {
    return this.calls.initiateCall(user.id, dto.targetUserId, dto.rideId, dto.errandId);
  }

  @Get(':sessionId/token')
  @ApiOperation({ summary: 'Get Agora token for a call session' })
  getToken(@CurrentUser() user: { id: string }, @Param('sessionId') sessionId: string) {
    return this.calls.getCallToken(sessionId, user.id);
  }

  @Post(':sessionId/end')
  @ApiOperation({ summary: 'End a call session' })
  endCall(
    @CurrentUser() user: { id: string },
    @Param('sessionId') sessionId: string,
    @Body() dto: EndCallDto,
  ) {
    return this.calls.endCall(sessionId, user.id, dto.durationSeconds);
  }
}
