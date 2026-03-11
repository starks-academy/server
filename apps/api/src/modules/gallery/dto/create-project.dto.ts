import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ProjectCategory } from '@app/database/entities/gallery-project.entity';

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ enum: ProjectCategory })
  @IsEnum(ProjectCategory)
  category: ProjectCategory;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  contractAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  demoUrl?: string;
}
