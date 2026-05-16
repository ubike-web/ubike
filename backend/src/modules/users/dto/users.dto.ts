import { IsString, IsOptional, IsEmail, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional() @IsString() @IsOptional() fullName?: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
}

export class SavedLocationDto {
  @ApiProperty({ example: 'Home' }) @IsString() @IsNotEmpty() label: string;
  @ApiProperty() @IsString() @IsNotEmpty() address: string;
  @ApiProperty() @IsNumber() latitude: number;
  @ApiProperty() @IsNumber() longitude: number;
}

export class UpdateFcmTokenDto {
  @ApiProperty() @IsString() @IsNotEmpty() fcmToken: string;
}
