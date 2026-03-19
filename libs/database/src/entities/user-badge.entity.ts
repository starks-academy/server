import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Badge } from "./badge.entity";

@Entity("user_badges")
export class UserBadge {
  @PrimaryColumn({ name: "user_id" })
  userId: string;

  @PrimaryColumn({ name: "badge_id" })
  badgeId: number;

  @CreateDateColumn({ name: "earned_at" })
  earnedAt: Date;

  @ManyToOne(() => User, (u) => u.badges)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Badge, (b) => b.earnedBy)
  @JoinColumn({ name: "badge_id" })
  badge: Badge;
}
