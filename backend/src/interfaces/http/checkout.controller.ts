import { Body, Controller, Post } from '@nestjs/common';
import { CheckoutService } from '../../application/checkout.service';
import { CheckoutInitDto, PayDto } from '../../domain/dto/checkout.dto';

@Controller()
export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  @Post('/checkout/init')
  init(@Body() dto: CheckoutInitDto) {
    return this.service.init(dto);
  }

  @Post('/checkout/pay')
  pay(@Body() dto: PayDto) {
    return this.service.pay(dto);
  }
}
