import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeductBalanceDto {
  @ApiProperty({ example: 1, description: 'ID ' })
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ example: 100, description: 'Сумма списания или возврата' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: 'purchase',
    description: 'Тип операции: purchase — списание, refund — возврат',
    enum: ['purchase', 'refund'],
  })
  @IsEnum(['purchase', 'refund'])
  @IsNotEmpty()
  action: 'purchase' | 'refund';
}
