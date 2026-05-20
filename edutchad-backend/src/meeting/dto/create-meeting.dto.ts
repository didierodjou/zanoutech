import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
    @IsNotEmpty()
    title!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsInt()
  @Min(1)
  duration!: number;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsString()
  @IsOptional()
  agenda?: string;

  @IsUUID()
    @IsNotEmpty()
    organizerId!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  participantUserIds?: string[];
}