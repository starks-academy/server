import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { verifyMessageSignatureRsv } from '@stacks/encryption';

import { User } from '@app/database/entities/user.entity';
import { VerifySignatureDto } from './dto/verify-signature.dto';

// In-memory nonce store (replace with Redis in production)
const nonceStore = new Map<string, { nonce: string; expiresAt: Date }>();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Generate a sign challenge nonce for the given wallet address.
   */
  async generateChallenge(walletAddress: string) {
    const nonce = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    nonceStore.set(walletAddress, { nonce, expiresAt });

    return {
      nonce,
      expiresAt,
      message: `Sign this message to authenticate with Stacks Academy.\n\nNonce: ${nonce}`,
    };
  }

  /**
   * Verify a signed challenge and issue a JWT.
   */
  async verifySignature(dto: VerifySignatureDto) {
    const { walletAddress, signature, publicKey } = dto;

    const stored = nonceStore.get(walletAddress);
    if (!stored) {
      throw new BadRequestException('No pending challenge for this wallet address');
    }

    if (new Date() > stored.expiresAt) {
      nonceStore.delete(walletAddress);
      throw new UnauthorizedException('Challenge has expired. Please request a new one.');
    }

    // Verify the signature against the nonce message
    const message = `Sign this message to authenticate with Stacks Academy.\n\nNonce: ${stored.nonce}`;

    let isValid = false;
    try {
      isValid = verifyMessageSignatureRsv({
        message,
        signature,
        publicKey,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid signature format');
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    nonceStore.delete(walletAddress);

    // Find or create user
    let user = await this.userRepo.findOne({ where: { walletAddress } });
    if (!user) {
      user = this.userRepo.create({ walletAddress });
      user = await this.userRepo.save(user);
    }

    const tokens = this.issueTokens(user);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  issueTokens(user: User) {
    const payload = {
      sub: user.id,
      walletAddress: user.walletAddress,
      level: user.level,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { accessToken, refreshToken };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }

  private sanitizeUser(user: User) {
    const { ...rest } = user;
    return rest;
  }
}
