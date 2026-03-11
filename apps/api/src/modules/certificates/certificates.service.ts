import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Certificate } from '@app/database/entities/certificate.entity';
import { StacksNftService } from './stacks/stacks-nft.service';

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Certificate)
    private readonly certRepo: Repository<Certificate>,
    private readonly nftService: StacksNftService,
  ) {}

  async mint(userId: string, moduleId: number, score: number) {
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
      console.error('NFT minting failed:', e.message);
    }

    return cert;
  }

  async getUserCerts(userId: string) {
    return this.certRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCertById(id: string) {
    return this.certRepo.findOne({ where: { id } });
  }
}
