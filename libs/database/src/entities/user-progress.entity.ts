import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum StepState {
  LOCKED = 'locked',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('user_progress')
@Index(['userId', 'courseId', 'lessonId', 'stepId'], { unique: true })
export class UserProgress extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'course_id' })
  courseId: number;

  @Column({ name: 'lesson_id' })
  lessonId: number;

  @Column({ name: 'step_id' })
  stepId: number;

  @Column({ type: 'enum', enum: StepState, default: StepState.LOCKED })
  state: StepState;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @ManyToOne(() => User, (u) => u.progress)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
