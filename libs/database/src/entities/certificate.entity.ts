import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('certificates')
export class Certificate extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'module_id' })
  moduleId: number;

  @Column()
  score: number;

  @Column({ name: 'tx_id', nullable: true, length: 100 })
  txId: string;

  @Column({ name: 'nft_token_id', nullable: true })
  nftTokenId: number;

  @Column({ name: 'minted_at', nullable: true })
  mintedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: object;

  @ManyToOne(() => User, (u) => u.certificates)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
