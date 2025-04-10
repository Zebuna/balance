import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { DeductBalanceDto } from './dto/deduct-balance.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('deduct-balance')
  @UsePipes(new ValidationPipe({ transform: true }))
  async deductBalance(@Body() dto: DeductBalanceDto) {
    return this.usersService.deductBalance(dto);
  }

  @Get(':id/balance')
  async getBalance(@Param('id') id: string) {
    const user = await this.usersService.getUserWithHistory(+id);
    return { balance: user.balance };
  }

  @Post(':id/recalculate-balance')
  async recalculateBalance(@Param('id') id: string) {
    return this.usersService.recalculateBalance(+id);
  }
}
