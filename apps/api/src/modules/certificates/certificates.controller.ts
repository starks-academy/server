import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@app/common/decorators/public.decorator";
import { CurrentUser } from "@app/common/decorators/current-user.decorator";
import { User } from "@app/database/entities/user.entity";
import { CertificatesService } from "./certificates.service";
import { MintCertificateDto } from "./dto/mint-certificate.dto";

@ApiTags("certificates")
@ApiBearerAuth("JWT")
@Controller("certificates")
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post("mint")
  @ApiOperation({
    summary: "Mint a SIP-009 NFT certificate for a completed module",
  })
  mint(@CurrentUser() user: User, @Body() dto: MintCertificateDto) {
    return this.certificatesService.mint(user.id, dto.moduleId, dto.score);
  }

  @Get("eligibility")
  @ApiOperation({
    summary: "Check if user is eligible to mint a certificate",
    description:
      "Returns eligibility status, completion percentage, and congratulations message if applicable",
  })
  checkEligibility(@CurrentUser() user: User) {
    return this.certificatesService.checkEligibility(user.id);
  }

  @Get("me")
  @ApiOperation({ summary: "Own earned certificates" })
  getMyCerts(@CurrentUser() user: User) {
    return this.certificatesService.getUserCerts(user.id);
  }

  @Public()
  @Get("user/:userId")
  @ApiOperation({ summary: "View user's public certificates" })
  getUserCerts(@Param("userId") userId: string) {
    return this.certificatesService.getUserCerts(userId);
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get single certificate metadata" })
  getCert(@Param("id") id: string) {
    return this.certificatesService.getCertById(id);
  }
}
