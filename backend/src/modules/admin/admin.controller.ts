import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  UpdateRiderVerificationDto, SuspendUserDto, ProcessWithdrawalDto,
  UpdatePricingDto, ResolveTicketDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { MatchingService } from '../matching/matching.service';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService, private matching: MatchingService) {}

  // ─── Dashboard stats ───
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Platform-wide stats' })
  getPlatformStats() {
    return this.admin.getPlatformStats();
  }

  @Get('rides/active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Get all active rides' })
  getActiveRides() {
    return this.admin.getActiveRides();
  }

  @Get('errands/active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Get all active errands' })
  getActiveErrands() {
    return this.admin.getActiveErrands();
  }

  @Get('heatmap')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Online rider heatmap data' })
  getHeatmap(@Query('serviceType') serviceType?: string) {
    return this.matching.getHeatmapData(serviceType);
  }

  // ─── User management ───
  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'List all users' })
  getUsers(@Query('role') role?: string, @Query('limit') limit = 50, @Query('offset') offset = 0) {
    return this.admin.getAllUsers(role, +limit, +offset);
  }

  @Patch('users/:id/suspend')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend or unsuspend a user' })
  suspendUser(
    @CurrentUser() admin: { id: string },
    @Param('id') userId: string,
    @Body() dto: SuspendUserDto,
  ) {
    return this.admin.suspendUser(userId, dto, admin.id);
  }

  // ─── Rider verification ───
  @Get('riders/pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get riders awaiting verification' })
  getPendingRiders(@Query('serviceType') serviceType?: string) {
    return this.admin.getPendingRiders(serviceType);
  }

  @Patch('riders/:id/verify')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve or reject a rider' })
  verifyRider(
    @CurrentUser() admin: { id: string },
    @Param('id') riderId: string,
    @Body() dto: UpdateRiderVerificationDto,
  ) {
    return this.admin.verifyRider(riderId, dto, admin.id);
  }

  // ─── Withdrawals ───
  @Get('withdrawals/pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pending withdrawal requests' })
  getPendingWithdrawals() {
    return this.admin.getPendingWithdrawals();
  }

  @Post('withdrawals/:id/process')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve or reject a withdrawal' })
  processWithdrawal(
    @CurrentUser() admin: { id: string },
    @Param('id') withdrawalId: string,
    @Body() dto: ProcessWithdrawalDto,
  ) {
    return this.admin.processWithdrawal(withdrawalId, dto, admin.id);
  }

  // ─── Support tickets ───
  @Get('tickets')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'List support tickets' })
  getTickets(@Query('status') status?: string) {
    return this.admin.getSupportTickets(status);
  }

  @Patch('tickets/:id/resolve')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.SUPPORT)
  @ApiOperation({ summary: 'Resolve a support ticket' })
  resolveTicket(
    @CurrentUser() admin: { id: string },
    @Param('id') ticketId: string,
    @Body() dto: ResolveTicketDto,
  ) {
    return this.admin.resolveTicket(ticketId, dto.resolution, admin.id);
  }

  // ─── Super admin pricing ───
  @Get('settings')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform settings' })
  getSettings() {
    return this.admin.getPlatformSettings();
  }

  @Patch('settings/pricing')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update platform pricing' })
  updatePricing(@CurrentUser() admin: { id: string }, @Body() dto: UpdatePricingDto) {
    return this.admin.updatePricing(dto, admin.id);
  }
}
