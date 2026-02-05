import { Injectable } from '@nestjs/common';
import { NotFoundError } from '../common/errors';
import { TransactionsRepository } from '../infrastructure/repository/transactions.repository';

@Injectable()
export class TransactionsService {
  constructor(private readonly repo: TransactionsRepository) {}

  async get(txId: string) {
    const tx = await this.repo.get(txId);
    if (!tx) throw new NotFoundError('Transaction not found');
    return tx;
  }
}
