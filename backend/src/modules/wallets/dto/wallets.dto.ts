import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawalDto {
  @ApiProperty({ minimum: 100 }) @IsNumber() @Min(100) amount: number;
  @ApiProperty({ example: 'mpesa' }) @IsString() @IsNotEmpty() payoutMethod: string;
  @ApiProperty({ example: '+254712345678' }) @IsString() @IsNotEmpty() payoutAccount: string;
  @ApiProperty({ example: 'John Doe' }) @IsString() @IsNotEmpty() payoutName: string;
}
