import {
  Column,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserProgress } from './user-progress.entity';
import { QuizSession } from './quiz-session.entity';
import { ChatSession } from './chat-session.entity';
import { XpEvent } from './xp-event.entity';
import { UserBadge } from './user-badge.entity';
import { Certificate } from './certificate.entity';
import { GalleryProject } from './gallery-project.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'wallet_address', length: 100 })
  walletAddress: string;

  @Column({ name: 'display_name', nullable: true, length: 100 })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ nullable: true, type: 'text' })
  bio: string;

  @Column({ name: 'xp_total', default: 0 })
  xpTotal: number;

  @Column({ default: 1 })
  level: number;

  @Column({ name: 'streak_days', default: 0 })
  streakDays: number;

  @Column({ name: 'longest_streak', default: 0 })
  longestStreak: number;

  @Column({ name: 'last_activity_at', nullable: true })
  lastActivityAt: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  // Relations
  @OneToMany(() => UserProgress, (p) => p.user)
  progress: UserProgress[];

  @OneToMany(() => QuizSession, (q) => q.user)
  quizSessions: QuizSession[];

  @OneToMany(() => ChatSession, (c) => c.user)
  chatSessions: ChatSession[];

  @OneToMany(() => XpEvent, (x) => x.user)
  xpEvents: XpEvent[];

  @OneToMany(() => UserBadge, (b) => b.user)
  badges: UserBadge[];

  @OneToMany(() => Certificate, (c) => c.user)
  certificates: Certificate[];

  @OneToMany(() => GalleryProject, (g) => g.user)
  projects: GalleryProject[];
}
