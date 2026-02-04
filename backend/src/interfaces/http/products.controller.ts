import { Controller, Get } from '@nestjs/common';
import { ProductsService } from '../../application/products.service';

@Controller()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('/products')
  list() {
    return this.productsService.list();
  }
}
