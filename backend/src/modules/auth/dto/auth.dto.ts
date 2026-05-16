import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiderServiceType, VehicleType } from '../../../common/enums/user-role.enum';

export class RegisterCustomerDto {
  @ApiProperty() @IsString() @IsNotEmpty() fullName: string;
  @ApiProperty({ example: '+254712345678' }) @IsString() @IsNotEmpty() phone: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) password: string;
}

export class RegisterRiderDto {
  @ApiProperty() @IsString() @IsNotEmpty() fullName: string;
  @ApiProperty({ example: '+254712345678' }) @IsString() @IsNotEmpty() phone: string;
  @ApiPropertyOptional() @IsEmail() @IsOptional() email?: string;
  @ApiProperty({ minLength: 8 }) @IsString() @MinLength(8) password: string;
  @ApiProperty({ enum: RiderServiceType }) @IsEnum(RiderServiceType) serviceType: RiderServiceType;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType: VehicleType;
  @ApiProperty({ example: 'KBX 123A' }) @IsString() @IsNotEmpty() plateNumber: string;
  @ApiProperty({ example: 'Honda CG125' }) @IsString() @IsNotEmpty() vehicleModel: string;
  @ApiProperty({ example: 'Red' }) @IsString() @IsNotEmpty() vehicleColor: string;
}

export class LoginDto {
  @ApiProperty({ example: '+254712345678' }) @IsString() @IsNotEmpty() phone: string;
  @ApiProperty() @IsString() @IsNotEmpty() password: string;
}

export class RefreshTokenDto {
  @ApiProperty() @IsString() @IsNotEmpty() refreshToken: string;
}

export class VerifyPhoneDto {
  @ApiProperty({ example: '+254712345678' }) @IsString() @IsNotEmpty() phone: string;
  @ApiProperty({ example: '123456' }) @IsString() @IsNotEmpty() code: string;
}

export class ResendOtpDto {
  @ApiProperty({ example: '+254712345678' }) @IsString() @IsNotEmpty() phone: string;
}
