import { PartialType } from '@nestjs/mapped-types';
import { CreateBulletinDto } from './create-bulletin.dto';

export class UpdateBulletinDto extends PartialType(CreateBulletinDto) {}
