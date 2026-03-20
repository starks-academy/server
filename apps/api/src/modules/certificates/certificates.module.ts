import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { Certificate } from "@app/database/entities/certificate.entity";
import { CertificatesController } from "./certificates.controller";
import { CertificatesMetadataController } from "./certificates-metadata.controller";
import { CertificatesService } from "./certificates.service";
import { StacksNftService } from "./stacks/stacks-nft.service";
import { CoursesModule } from "../courses/courses.module";

@Module({
  imports: [TypeOrmModule.forFeature([Certificate]), HttpModule, CoursesModule],
  controllers: [CertificatesController, CertificatesMetadataController],
  providers: [CertificatesService, StacksNftService],
  exports: [CertificatesService],
})
export class CertificatesModule {}
