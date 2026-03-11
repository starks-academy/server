import { Column, CreateDateColumn, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('xp_events')
export class XpEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  amount: number;

  @Column({ length: 100 })
  reason: string;

  @Column({ name: 'reference_id', nullable: true, length: 255 })
  referenceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (u) => u.xpEvents)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
