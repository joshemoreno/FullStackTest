import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CheckoutInitDto, PayDto } from '../checkout.dto';

describe('DTO validations', () => {
  describe('CheckoutInitDto', () => {
    it('debe ser válido con payload correcto', async () => {
      const dto = plainToInstance(CheckoutInitDto, {
        productId: 'p-001',
        quantity: 1,
        customer: {
          fullName: 'Jose Moreno',
          email: 'jose@test.com',
          phone: '3000000000',
        },
        delivery: {
          addressLine1: 'Calle 1 # 2-3',
          city: 'Cali',
        },
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('debe fallar si productId está vacío', async () => {
      const dto = plainToInstance(CheckoutInitDto, {
        productId: '',
        quantity: 1,
        customer: { fullName: 'Jose', email: 'jose@test.com', phone: '300' },
        delivery: { addressLine1: 'Calle 1', city: 'Cali' },
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'productId')).toBe(true);
    });

    it('debe fallar si quantity < 1', async () => {
      const dto = plainToInstance(CheckoutInitDto, {
        productId: 'p-001',
        quantity: 0,
        customer: { fullName: 'Jose', email: 'jose@test.com', phone: '300' },
        delivery: { addressLine1: 'Calle 1', city: 'Cali' },
      });

      const errors = await validate(dto);
      const qtyErr = errors.find(e => e.property === 'quantity');
      expect(qtyErr).toBeDefined();
    });

    it('debe fallar si customer.email no es email', async () => {
      const dto = plainToInstance(CheckoutInitDto, {
        productId: 'p-001',
        quantity: 1,
        customer: { fullName: 'Jose', email: 'no-es-email', phone: '300' },
        delivery: { addressLine1: 'Calle 1', city: 'Cali' },
      });

      const errors = await validate(dto);
      const customerErr = errors.find(e => e.property === 'customer');
      expect(customerErr).toBeDefined();
      expect(customerErr?.children?.some(c => c.property === 'email')).toBe(true);
    });

    it('debe fallar si delivery.addressLine1 está vacío', async () => {
      const dto = plainToInstance(CheckoutInitDto, {
        productId: 'p-001',
        quantity: 1,
        customer: { fullName: 'Jose', email: 'jose@test.com', phone: '300' },
        delivery: { addressLine1: '', city: 'Cali' },
      });

      const errors = await validate(dto);
      const deliveryErr = errors.find(e => e.property === 'delivery');
      expect(deliveryErr).toBeDefined();
      expect(deliveryErr?.children?.some(c => c.property === 'addressLine1')).toBe(true);
    });
  });

  describe('PayDto', () => {
    it('debe ser válido con payload correcto (sin installments)', async () => {
      const dto = plainToInstance(PayDto, {
        txId: 'b2b7c3c6-8d9c-4d1f-8a1c-1c8b7b6d9b10',
        number: '4242424242424242',
        exp_month: '06',
        exp_year: '29',
        cvc: '123',
        card_holder: 'Jose Moreno',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('debe fallar si falta txId', async () => {
      const dto = plainToInstance(PayDto, {
        number: '4242424242424242',
        exp_month: '06',
        exp_year: '29',
        cvc: '123',
        card_holder: 'Jose Moreno',
      });

      const errors = await validate(dto);
      expect(errors.some(e => e.property === 'txId')).toBe(true);
    });

    it('installments es opcional, pero si viene debe ser int y >= 1', async () => {
      const dto = plainToInstance(PayDto, {
        txId: 'tx-1',
        number: '4242424242424242',
        exp_month: '06',
        exp_year: '29',
        cvc: '123',
        card_holder: 'Jose Moreno',
        installments: 0,
      });

      const errors = await validate(dto);
      const instErr = errors.find(e => e.property === 'installments');
      expect(instErr).toBeDefined();
    });

    it('debe fallar si installments no es entero (ej: 1.5)', async () => {
      const dto = plainToInstance(PayDto, {
        txId: 'tx-1',
        number: '4242424242424242',
        exp_month: '06',
        exp_year: '29',
        cvc: '123',
        card_holder: 'Jose Moreno',
        installments: 1.5,
      });

      const errors = await validate(dto);
      const instErr = errors.find(e => e.property === 'installments');
      expect(instErr).toBeDefined();
    });
  });
});
