import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Certificate } from "@app/database/entities/certificate.entity";
import { StacksNftService } from "./stacks/stacks-nft.service";
import { CoursesService } from "../courses/courses.service";

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certRepo: Repository<Certificate>,
    private readonly nftService: StacksNftService,
    private readonly coursesService: CoursesService,
  ) {}

  async mint(userId: string, moduleId: number, score: number) {
    // Check if user has completed the entire curriculum
    const overallProgress =
      await this.coursesService.getOverallProgress(userId);

    if (!overallProgress.isComplete) {
      throw new BadRequestException(
        `Cannot mint certificate. Curriculum completion: ${overallProgress.progressPercentage}%. You must complete all courses (100%) to mint a certificate.`,
      );
    }

    // Check if certificate already exists for this user
    const existingCert = await this.certRepo.findOne({
      where: { userId },
    });

    if (existingCert) {
      throw new BadRequestException(
        "Certificate already minted for this user. Only one certificate per user is allowed.",
      );
    }

    // Persist a pending certificate record first
    let cert = this.certRepo.create({ userId, moduleId, score });
    cert = await this.certRepo.save(cert);

    // Attempt to mint (fire-and-forget in production; use a job queue)
    try {
      const { txId } = await this.nftService.mintCertificate({
        recipientAddress: userId, // In practice, the user's wallet address
        moduleId,
        score,
        certId: cert.id,
      });
      cert.txId = txId;
      cert.mintedAt = new Date();
      await this.certRepo.save(cert);
    } catch (e) {
      // Log but don't fail — the certificate record exists, minting can be retried
      console.error("NFT minting failed:", e.message);
    }

    return cert;
  }

  async getUserCerts(userId: string) {
    return this.certRepo.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async getCertById(id: string) {
    return this.certRepo.findOne({ where: { id } });
  }

  async getCertByTokenId(tokenId: number) {
    return this.certRepo.findOne({ where: { nftTokenId: tokenId } });
  }

  /**
   * Check if user is eligible to mint a certificate
   */
  async checkEligibility(userId: string) {
    const overallProgress =
      await this.coursesService.getOverallProgress(userId);
    const existingCert = await this.certRepo.findOne({ where: { userId } });

    return {
      isEligible: overallProgress.isComplete && !existingCert,
      curriculumComplete: overallProgress.isComplete,
      progressPercentage: overallProgress.progressPercentage,
      alreadyMinted: !!existingCert,
      certificate: existingCert || null,
      message: this.getEligibilityMessage(
        overallProgress.isComplete,
        !!existingCert,
      ),
    };
  }

  private getEligibilityMessage(
    isComplete: boolean,
    alreadyMinted: boolean,
  ): string {
    if (alreadyMinted) {
      return "You have already minted your certificate!";
    }
    if (isComplete) {
      return "Congratulations! You've completed the entire curriculum and can now mint your certificate!";
    }
    return "Complete all courses to unlock certificate minting.";
  }
}
