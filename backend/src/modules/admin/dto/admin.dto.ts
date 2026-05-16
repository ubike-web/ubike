import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '../../../common/enums/user-role.enum';

export class UpdateRiderVerificationDto {
  @ApiProperty({ enum: VerificationStatus }) @IsEnum(VerificationStatus) status: VerificationStatus;
  @ApiPropertyOptional() @IsString() @IsOptional() reason?: string;
}

export class SuspendUserDto {
  @ApiProperty() @IsBoolean() suspend: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() reason?: string;
}

export class ProcessWithdrawalDto {
  @ApiProperty({ enum: ['approve', 'reject'] }) @IsString() action: 'approve' | 'reject';
  @ApiPropertyOptional() @IsString() @IsOptional() reason?: string;
}

export class UpdatePricingDto {
  @ApiPropertyOptional() @IsNumber() @IsOptional() baseFare?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() kmRate?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() electricSurcharge?: number;
  @ApiPropertyOptional() @IsNumber() @IsOptional() commission?: number;
}

export class ResolveTicketDto {
  @ApiProperty() @IsString() @IsNotEmpty() resolution: string;
}
