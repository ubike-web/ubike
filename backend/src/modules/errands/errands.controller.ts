import {
  Controller, Get, Post, Patch, Body, Param, UseGuards,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ErrandsService } from './errands.service';
import { CreateErrandDto, UpdateErrandStatusDto, RateErrandDto } from './dto/errands.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('errands')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('errands')
export class ErrandsController {
  constructor(private errands: ErrandsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new errand / delivery request' })
  createErrand(@CurrentUser() user: { id: string }, @Body() dto: CreateErrandDto) {
    return this.errands.createErrand(user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get errand details' })
  getErrand(@Param('id') id: string) {
    return this.errands.getErrand(id);
  }

  @Post(':id/accept')
  @Roles(UserRole.ERRANDS_RIDER)
  @ApiOperation({ summary: 'Errands rider accepts a request' })
  acceptErrand(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.errands.acceptErrand(user.id, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.ERRANDS_RIDER)
  @ApiOperation({ summary: 'Update errand status (picked_up, in_transit, delivered)' })
  updateStatus(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateErrandStatusDto,
  ) {
    return this.errands.updateStatus(user.id, id, dto);
  }

  @Post(':id/proof')
  @Roles(UserRole.ERRANDS_RIDER)
  @UseInterceptors(FileInterceptor('proof'))
  @ApiOperation({ summary: 'Upload proof-of-delivery photo' })
  uploadProof(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.errands.uploadDeliveryProof(user.id, id, file);
  }

  @Post(':id/rate')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Rate a completed errand' })
  rateErrand(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: RateErrandDto,
  ) {
    return this.errands.rateErrand(user.id, id, dto);
  }
}
