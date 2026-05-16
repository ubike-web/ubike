import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService) {}

  @Get('rider/earnings')
  @Roles(UserRole.TRANSPORT_RIDER, UserRole.ERRANDS_RIDER)
  @ApiOperation({ summary: 'Rider earnings analytics' })
  getRiderEarnings(
    @CurrentUser() user: { id: string },
    @Query('period') period: 'week' | 'month' | 'all' = 'week',
  ) {
    return this.analytics.getRiderAnalytics(user.id, period);
  }

  @Get('customer/stats')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Customer usage statistics' })
  getCustomerStats(@CurrentUser() user: { id: string }) {
    return this.analytics.getCustomerStats(user.id);
  }

  @Get('platform/revenue')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Platform revenue chart (admin only)' })
  getRevenueChart(@Query('days') days = 30) {
    return this.analytics.getPlatformRevenueChart(+days);
  }
}
