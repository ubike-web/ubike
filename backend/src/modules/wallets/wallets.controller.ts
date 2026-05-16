import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { WithdrawalDto } from './dto/wallets.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('wallets')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private wallets: WalletsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my wallet balance and stats' })
  getWallet(@CurrentUser() user: { id: string }) {
    return this.wallets.getWallet(user.id);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  getTransactions(
    @CurrentUser() user: { id: string },
    @Query('limit') limit = 30,
    @Query('offset') offset = 0,
  ) {
    return this.wallets.getTransactionHistory(user.id, +limit, +offset);
  }

  @Post('me/withdraw')
  @ApiOperation({ summary: 'Request a payout / withdrawal' })
  requestWithdrawal(@CurrentUser() user: { id: string }, @Body() dto: WithdrawalDto) {
    return this.wallets.requestWithdrawal(user.id, dto);
  }

  @Get('me/withdrawals')
  @ApiOperation({ summary: 'Get all withdrawal requests' })
  getWithdrawals(@CurrentUser() user: { id: string }) {
    return this.wallets.getWithdrawals(user.id);
  }
}
