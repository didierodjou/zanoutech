import { IsString, IsNotEmpty, IsDateString, IsInt, Min, IsOptional, IsArray, IsUUID, IsBoolean, IsUrl, IsEnum } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @IsInt()
  @Min(1)
  duration!: number;

  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;

  @IsString()
  @IsNotEmpty()
  location!: string;

  @IsUrl()
  @IsOptional()
  meetingUrl?: string;

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