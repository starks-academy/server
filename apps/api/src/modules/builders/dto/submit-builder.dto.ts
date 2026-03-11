import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { BuilderCategory } from '@app/database/entities/builder-profile.entity';

export class SubmitBuilderDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '@yourhandle' })
  @IsString()
  @MaxLength(100)
  handle: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  role: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ enum: BuilderCategory })
  @IsEnum(BuilderCategory)
  category: BuilderCategory;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  twitterUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;
}
