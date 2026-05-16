import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RidesService } from './rides.service';
import {
  CreateRideDto, UpdateRideStatusDto, RateRideDto, ScheduleRideDto, FareEstimateDto,
} from './dto/rides.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('rides')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rides')
export class RidesController {
  constructor(private rides: RidesService) {}

  @Post('estimate')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get fare estimate before booking' })
  estimate(@Body() dto: FareEstimateDto) {
    return this.rides.getFareEstimate(
      dto.pickupLat, dto.pickupLng, dto.destLat, dto.destLng, dto.vehicleType,
    );
  }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Request a new bike ride' })
  createRide(@CurrentUser() user: { id: string }, @Body() dto: CreateRideDto) {
    return this.rides.requestRide(user.id, dto);
  }

  @Post('schedule')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Schedule a ride for a future time' })
  scheduleRide(@CurrentUser() user: { id: string }, @Body() dto: ScheduleRideDto) {
    return this.rides.scheduleRide(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride details' })
  getRide(@Param('id') id: string) {
    return this.rides.getRide(id);
  }

  @Post(':id/accept')
  @Roles(UserRole.TRANSPORT_RIDER)
  @ApiOperation({ summary: 'Rider accepts a ride request' })
  acceptRide(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.rides.acceptRide(user.id, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.TRANSPORT_RIDER)
  @ApiOperation({ summary: 'Rider updates ride status (arriving, in_progress, completed)' })
  updateStatus(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateRideStatusDto,
  ) {
    return this.rides.updateStatus(user.id, id, dto);
  }

  @Post(':id/cancel')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer cancels a ride' })
  cancelRide(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.rides.cancelRide(user.id, id, reason);
  }

  @Post(':id/rate')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Rate a completed ride' })
  rateRide(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: RateRideDto,
  ) {
    return this.rides.rateRide(user.id, id, dto);
  }
}
