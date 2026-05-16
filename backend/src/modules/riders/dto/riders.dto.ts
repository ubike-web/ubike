import { IsBoolean, IsNumber, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleOnlineDto {
  @ApiProperty() @IsBoolean() isOnline: boolean;
}

export class UpdateLocationDto {
  @ApiProperty({ example: -1.286389 }) @IsNumber() latitude: number;
  @ApiProperty({ example: 36.817223 }) @IsNumber() longitude: number;
}

export class UpdateRiderFcmDto {
  @ApiProperty() @IsString() @IsNotEmpty() fcmToken: string;
}
