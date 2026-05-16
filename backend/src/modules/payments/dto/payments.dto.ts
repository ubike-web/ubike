import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializePaymentDto {
  @ApiProperty({ example: 500, description: 'Amount in KES' })
  @IsNumber()
  @Min(10)
  amount: number;
}
