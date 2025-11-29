import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber } from 'class-validator';

export class ProductEditedEventDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  sellerId: string;

  @IsArray()
  @IsNotEmpty()
  changedFields: string[];

  @IsNumber()
  @IsOptional()
  oldPrice?: number;

  @IsNumber()
  @IsOptional()
  newPrice?: number;

  @IsNumber()
  @IsOptional()
  oldStock?: number;

  @IsNumber()
  @IsOptional()
  newStock?: number;

  @IsString()
  @IsOptional()
  oldDescription?: string;

  @IsString()
  @IsOptional()
  newDescription?: string;

  @IsString()
  @IsNotEmpty()
  editedAt: string;

  @IsString()
  @IsOptional()
  sellerEmail?: string;
}
