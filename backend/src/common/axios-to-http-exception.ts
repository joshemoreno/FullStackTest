import axios, { AxiosError } from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';

export function axiosToHttpException(e: unknown, fallbackMessage: string): HttpException {
  // No es axios -> 500
  if (!axios.isAxiosError(e)) {
    return new HttpException(
      { statusCode: 500, message: fallbackMessage },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  const err = e as AxiosError<any>;

  // status del proveedor (si existe)
  const providerStatus = err.response?.status ?? null;

  // body real del proveedor (tu { error: { type, messages } })
  const providerResponse = err.response?.data ?? null;

  // si no hay response -> timeout / network
  const status =
    err.response?.status ??
    (err.code === 'ECONNABORTED' ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.BAD_GATEWAY);

  return new HttpException(
    {
      statusCode: status, // opcional pero útil
      message: fallbackMessage,
      provider: 'ApiPay',
      providerStatus,
      providerResponse,
    },
    status,
  );
}
