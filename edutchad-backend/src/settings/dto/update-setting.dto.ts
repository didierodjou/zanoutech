import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  schoolName?: string;

  @IsString()
  @IsOptional()
  schoolEmail?: string;

  @IsString()
  @IsOptional()
  schoolPhone?: string;

  @IsString()
  @IsOptional()
  schoolAddress?: string;

  @IsString()
  @IsOptional()
  principalName?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  logo?: string;
}