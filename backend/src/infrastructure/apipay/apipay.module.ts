import { Module } from '@nestjs/common';
import { ApiPayClient } from './apipay.client';

@Module({
  providers: [
    {
      provide: ApiPayClient,
      useValue: new ApiPayClient(),
    },
  ],
  exports: [ApiPayClient],
})
export class ApiPayModule {}
