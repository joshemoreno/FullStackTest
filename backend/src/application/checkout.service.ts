import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { BadRequestError, NotFoundError } from '../common/errors';
import { ProductsRepository } from '../infrastructure/repository/products.repository';
import { TransactionsRepository } from '../infrastructure/repository/transactions.repository';
import { ApiPayClient } from '../infrastructure/apipay/apipay.client';
import { CheckoutInitDto, PayDto } from '../domain/dto/checkout.dto';
import { Transaction } from '../domain/types/Transaction.type';
import { ApiPayIntegritySignature } from '../infrastructure/apipay/apipay.integrity';


@Injectable()
export class CheckoutService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly apipay: ApiPayClient,
  ) {}

  async init(dto: CheckoutInitDto) {
    const product = await this.productsRepository.get(dto.productId);
    if (!product) throw new NotFoundError('Product not found');
    if (!product.active) throw new BadRequestError('Product not available');
    if (product.stock < dto.quantity) throw new BadRequestError('Not enough stock');

    const amount = product.price_in_cents * dto.quantity;
    const baseFee = env.BASE_FEE_IN_CENTS;
    const deliveryFee = env.DELIVERY_FEE_IN_CENTS;
    const total = amount + baseFee + deliveryFee;

    const now = new Date().toISOString();
    const txId = randomUUID();

    const tx: Transaction = {
      txId,
      productId: dto.productId,
      quantity: dto.quantity,

      amount_in_cents: amount,
      base_fee_in_cents: baseFee,
      delivery_fee_in_cents: deliveryFee,
      total_in_cents: total,
      currency: env.CURRENCY,

      customer: dto.customer,
      delivery: { ...dto.delivery, country: dto.delivery.country ?? 'CO' },
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    await this.transactionsRepository.create(tx);

    return {
      txId,
      status: tx.status,
      summary: {
        amount_in_cents: amount,
        base_fee_in_cents: baseFee,
        delivery_fee_in_cents: deliveryFee,
        total_in_cents: total,
        currency: env.CURRENCY,
      },
    };
  }

  async pay(dto: PayDto) {
    const tx = await this.transactionsRepository.get(dto.txId);
    if (!tx) throw new NotFoundError('Transaction not found');
    if (tx.status !== 'PENDING') {
      return { txId: tx.txId, status: tx.status, apipay: tx.apipay ?? null };
    }

    const tokens = await this.apipay.getAcceptanceTokens();

    // Tokenizar tarjeta
    const cardToken = await this.apipay.tokenizeCard({
      number: dto.number,
      exp_month: dto.exp_month,
      exp_year: dto.exp_year,
      cvc: dto.cvc,
      card_holder: dto.card_holder,
    });

    // Crear reference y signature de integridad SHA256
    const reference = `TX-${randomUUID()}`;
    const signature = ApiPayIntegritySignature({
      reference,
      amount_in_cents: tx.total_in_cents,
      currency: tx.currency,
      integritySecret: env.APIPAY_INTEGRITY_SECRET,
    });

    // Crear transacción en ApiPay
    const apipayTx = await this.apipay.createCardTransaction({
      acceptance_token: tokens.acceptance_token,
      accept_personal_auth: tokens.accept_personal_auth,
      amount_in_cents: tx.total_in_cents,
      currency: tx.currency,
      customer_email: tx.customer.email,
      reference,
      signature,
      cardToken,
      installments: dto.installments ?? 1,
    });

    if(apipayTx){
      await this.transactionsRepository.setApiPayData(tx.txId, apipayTx.id, reference);
      await this.transactionsRepository.setApiPayStatusInfo(tx.txId, apipayTx.status_message);

      return {
        txId: tx.txId,
        status: 'PENDING',
        apipay: { apiPayTxId: apipayTx.id, reference },
        next: { poll: `/transactions/${tx.txId}` },
      };
    }
  }

  async getTransactionAndRefresh(txId: string) {
    const tx = await this.transactionsRepository.get(txId);
    if (!tx) throw new NotFoundError('Transaction not found');

    // Si ya está finalizada, se devuleve la transaccion
    if (tx.status === 'APPROVED' || tx.status === 'DECLINED' || tx.status === 'ERROR') {
      return tx;
    }

    // Si no hay apiPayTxId, es PENDING creado por init pero aún no pagado
    const apiPayTxId = tx.apipay?.apiPayTxId;
    if (!apiPayTxId) return tx;

    // Refresca desde apiPay
    const remote = await this.apipay.getTransaction(apiPayTxId);

    if (remote.status === 'PENDING') return tx;

    const mapped: 'APPROVED' | 'DECLINED' | 'ERROR' =
      remote.status === 'APPROVED'
        ? 'APPROVED'
        : remote.status === 'DECLINED'
        ? 'DECLINED'
        : 'ERROR';

    // Se Persiste info de proveedor (mensaje/error)
    await this.transactionsRepository.setApiPayStatusInfo(
      txId,
      remote.status_message,
      mapped === 'ERROR' ? remote.status_message : undefined
    );

    // Se persiste el status FINAL en Dynamo
    await this.transactionsRepository.updateStatus(txId, mapped);

    if (mapped === 'APPROVED') {
      const canFinalize = await this.transactionsRepository.finalizeStockDiscountOnce(txId);

      if (canFinalize) {
        try {
          await this.productsRepository.decrementStock(tx.productId, tx.quantity);
        } catch (e: any) {
          // si el descuento falla, marca la transaccion como ERROR
          await this.transactionsRepository.setApiPayStatusInfo(
            txId,
            remote.status_message,
            'Stock update failed'
          );
          await this.transactionsRepository.updateStatus(txId, 'ERROR');
        }
      }
    }

    // Se Retorna la versión persistida 
    return await this.transactionsRepository.get(txId);
  }
}
