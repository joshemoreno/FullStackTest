import { Injectable } from '@nestjs/common';
import { ProductsRepository } from '../infrastructure/repository/products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepo: ProductsRepository) {}

  list() {
    return this.productsRepo.list();
  }
}
