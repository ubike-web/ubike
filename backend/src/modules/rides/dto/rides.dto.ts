import {
  IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum,
  Min, Max, IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RideStatus, VehicleType } from '../../../common/enums/user-role.enum';

export class CreateRideDto {
  @ApiProperty() @IsString() @IsNotEmpty() pickupAddress: string;
  @ApiProperty() @IsNumber() pickupLat: number;
  @ApiProperty() @IsNumber() pickupLng: number;
  @ApiProperty() @IsString() @IsNotEmpty() destinationAddress: string;
  @ApiProperty() @IsNumber() destinationLat: number;
  @ApiProperty() @IsNumber() destinationLng: number;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiProperty() @IsNumber() estimatedFare: number;
  @ApiProperty() @IsNumber() distanceKm: number;
  @ApiPropertyOptional() @IsString() @IsOptional() note?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() scheduledFor?: string;
}

export class ScheduleRideDto extends CreateRideDto {
  @ApiProperty() @IsDateString() scheduledFor: string;
}

export class UpdateRideStatusDto {
  @ApiProperty({ enum: RideStatus }) @IsEnum(RideStatus) status: RideStatus;
  @ApiPropertyOptional() @IsString() @IsOptional() cancelReason?: string;
}

export class RateRideDto {
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsNumber() @Min(1) @Max(5) rating: number;
  @ApiPropertyOptional() @IsString() @IsOptional() comment?: string;
}

export class FareEstimateDto {
  @ApiProperty() @IsNumber() pickupLat: number;
  @ApiProperty() @IsNumber() pickupLng: number;
  @ApiProperty() @IsNumber() destLat: number;
  @ApiProperty() @IsNumber() destLng: number;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
}
