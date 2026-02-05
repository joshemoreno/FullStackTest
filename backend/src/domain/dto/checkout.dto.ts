import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CustomerDto {
  @ApiProperty({ example: 'Jose Moreno' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'jose@test.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '3000000000' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: '1234567890', required: false })
  @IsOptional()
  @IsString()
  legalId?: string;

  @ApiProperty({ example: 'CC', required: false, description: 'CC, CE, NIT, etc.' })
  @IsOptional()
  @IsString()
  legalIdType?: string;
}

class DeliveryDto {
  @ApiProperty({ example: 'Calle 1 # 2-3' })
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @ApiProperty({ example: 'Apto 402', required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ example: 'Cali' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'Valle del Cauca', required: false })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: 'CO', required: false, description: 'ISO country code' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: 'Portería, entregar en la tarde', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckoutInitDto {
  @ApiProperty({ example: 'p-001' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    type: CustomerDto,
    example: {
      fullName: 'Jose Moreno',
      email: 'jose@test.com',
      phone: '3000000000',
      legalId: '1234567890',
      legalIdType: 'CC',
    },
  })
  @ValidateNested()
  @Type(() => CustomerDto)
  customer!: CustomerDto;

  @ApiProperty({
    type: DeliveryDto,
    example: {
      addressLine1: 'Calle 1 # 2-3',
      addressLine2: 'Apto 402',
      city: 'Cali',
      region: 'Valle del Cauca',
      country: 'CO',
      notes: 'Portería',
    },
  })
  @ValidateNested()
  @Type(() => DeliveryDto)
  delivery!: DeliveryDto;
}

export class PayDto {
  @ApiProperty({ example: 'b2b7c3c6-8d9c-4d1f-8a1c-1c8b7b6d9b10' })
  @IsString()
  @IsNotEmpty()
  txId!: string;

  @ApiProperty({ example: '4242424242424242' })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiProperty({ example: '06', description: 'MM' })
  @IsString()
  @IsNotEmpty()
  exp_month!: string;

  @ApiProperty({ example: '29', description: 'YY' })
  @IsString()
  @IsNotEmpty()
  exp_year!: string;

  @ApiProperty({ example: '123' })
  @IsString()
  @IsNotEmpty()
  cvc!: string;

  @ApiProperty({ example: 'Jose Moreno' })
  @IsString()
  @IsNotEmpty()
  card_holder!: string;

  @ApiProperty({ example: 1, required: false, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number;
}
