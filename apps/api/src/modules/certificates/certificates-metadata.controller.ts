import { Controller, Get, Param, NotFoundException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "@app/common/decorators/public.decorator";
import { CertificatesService } from "./certificates.service";
import { StacksNftService } from "./stacks/stacks-nft.service";

@ApiTags("nft")
@Controller("nft/certificate")
export class CertificatesMetadataController {
  constructor(
    private readonly certificatesService: CertificatesService,
    private readonly nftService: StacksNftService,
  ) {}

  @Public()
  @Get(":tokenId")
  @ApiOperation({
    summary: "Get NFT metadata for a certificate token",
    description:
      "Returns SIP-009 compliant metadata for the certificate NFT. This endpoint is called by the Stacks blockchain when resolving token URIs.",
  })
  async getMetadata(@Param("tokenId") tokenId: string) {
    // Find the certificate by NFT token ID
    const cert = await this.certificatesService.getCertByTokenId(
      parseInt(tokenId, 10),
    );

    if (!cert) {
      throw new NotFoundException(
        `Certificate with token ID ${tokenId} not found`,
      );
    }

    // Return SIP-009 compliant metadata
    return this.nftService.getCertificateMetadata(cert.id, cert.nftTokenId);
  }
}
