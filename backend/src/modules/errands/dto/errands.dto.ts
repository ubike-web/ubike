import {
  IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min, Max, IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ErrandStatus } from '../../../common/enums/user-role.enum';

export class CreateErrandDto {
  @ApiProperty() @IsString() @IsNotEmpty() pickupAddress: string;
  @ApiProperty() @IsNumber() pickupLat: number;
  @ApiProperty() @IsNumber() pickupLng: number;
  @ApiProperty() @IsString() @IsNotEmpty() deliveryAddress: string;
  @ApiProperty() @IsNumber() deliveryLat: number;
  @ApiProperty() @IsNumber() deliveryLng: number;
  @ApiProperty() @IsString() @IsNotEmpty() itemDescription: string;
  @ApiProperty({ enum: ['small', 'medium', 'large'] }) @IsString() itemSize: string;
  @ApiPropertyOptional() @IsNumber() @IsOptional() itemValue?: number;
  @ApiPropertyOptional() @IsString() @IsOptional() recipientName?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() recipientPhone?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() note?: string;
  @ApiProperty() @IsNumber() estimatedFare: number;
  @ApiProperty() @IsNumber() distanceKm: number;
  @ApiPropertyOptional({ description: 'Additional stops (lat/lng pairs)' })
  @IsArray() @IsOptional() stops?: Array<{ lat: number; lng: number; address: string }>;
}

export class UpdateErrandStatusDto {
  @ApiProperty({ enum: ErrandStatus }) @IsEnum(ErrandStatus) status: ErrandStatus;
  @ApiPropertyOptional() @IsString() @IsOptional() cancelReason?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryProofUrl?: string;
}

export class RateErrandDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsNumber() @Min(1) @Max(5) rating: number;
  @ApiPropertyOptional() @IsString() @IsOptional() comment?: string;
}

export class UploadDeliveryProofDto {
  @ApiPropertyOptional() @IsString() @IsOptional() note?: string;
}
