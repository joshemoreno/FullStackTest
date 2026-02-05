import { Controller, Get, Param } from '@nestjs/common';
import { CheckoutService } from '../../application/checkout.service';

@Controller()
export class TransactionsController {
  constructor(private readonly checkout: CheckoutService) {}

  @Get('/transactions/:txId')
  get(@Param('txId') txId: string) {
    return this.checkout.getTransactionAndRefresh(txId);
  }
}
