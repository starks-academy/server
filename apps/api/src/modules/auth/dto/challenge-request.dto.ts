import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ChallengeRequestDto {
  @ApiProperty({ example: 'SP1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRCBGD1' })
  @IsString()
  @Matches(/^(SP|SM|ST)[A-Z0-9]+$/, { message: 'Invalid Stacks wallet address format' })
  walletAddress: string;
}
