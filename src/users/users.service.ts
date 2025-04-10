import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { User } from './entities/user.entity';
import { PaymentHistory } from './entities/payment-history.entity';
import { DeductBalanceDto } from './dto/deduct-balance.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(PaymentHistory)
    private paymentHistoryRepository: Repository<PaymentHistory>,
    private dataSource: DataSource,
  ) {}

  async deductBalance(deductBalanceDto: DeductBalanceDto): Promise<{ message: string; balance: number }> {
    const { userId, amount, action } = deductBalanceDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

    
      user.balance = Number(user.balance) - Number(amount);
      await queryRunner.manager.save(user);

      const paymentRecord = new PaymentHistory();
      paymentRecord.user = user;
      paymentRecord.action = action;
      paymentRecord.amount = action === 'refund' ? amount : -amount;

      await queryRunner.manager.save(paymentRecord);

      await this.recalculateBalance(user.id, queryRunner.manager);

      await queryRunner.commitTransaction();

      return {
        message: 'Balance deducted successfully',
        balance: user.balance,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getUserWithHistory(userId: number): Promise<User> {
    return this.usersRepository.findOne({
      where: { id: userId },
      relations: ['paymentHistory'],
    });
  }

  async recalculateBalance(userId: number, manager?: EntityManager): Promise<User> {
    const em = manager ?? this.dataSource.manager;

    const user = await em.findOne(User, { where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const history = await em.find(PaymentHistory, {
      where: { user: { id: userId } },
    });

    const newBalance = history.reduce(
      (sum, record) => sum + Number(record.amount),
      0,
    );

    user.balance = newBalance;
    return em.save(user);
  }
}
