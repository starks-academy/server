import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress, StepState } from '@app/database/entities/user-progress.entity';

/**
 * Course curriculum is defined statically here (or loaded from a seed/config).
 * This avoids a separate courses table while keeping data in one place.
 * In future, this can be migrated to a CMS-backed DB table.
 */
const CURRICULUM = [
  {
    id: 1,
    title: 'Bitcoin Fundamentals',
    description: 'Understand the core principles of Bitcoin.',
    lessons: [
      { id: 1, title: 'Bitcoin 101', steps: [{ id: 1, title: 'What is Bitcoin?' }, { id: 2, title: 'History' }] },
      { id: 2, title: 'The Bitcoin Network', steps: [{ id: 1, title: 'Nodes' }, { id: 2, title: 'Miners' }] },
      { id: 3, title: 'Proof of Work', steps: [{ id: 1, title: 'PoW Explained' }] },
      { id: 4, title: 'Wallets & Nodes', steps: [{ id: 1, title: 'Key Management' }] },
    ],
  },
  {
    id: 2,
    title: 'Introduction to Stacks',
    description: 'Explore the Stacks L2 ecosystem.',
    lessons: [
      { id: 1, title: 'Basics of Stacks', steps: [{ id: 1, title: 'What is Stacks?' }] },
      { id: 2, title: 'Proof of Transfer (PoX)', steps: [{ id: 1, title: 'PoX Mechanics' }] },
      { id: 3, title: 'sBTC Overview', steps: [{ id: 1, title: 'sBTC Bridge' }] },
      { id: 4, title: 'Stacks Architecture', steps: [{ id: 1, title: 'Microblocks' }] },
    ],
  },
  {
    id: 3,
    title: 'Clarity Smart Contracts',
    description: 'Write smart contracts using the Clarity language.',
    lessons: [
      { id: 1, title: 'Clarity Syntax', steps: [{ id: 1, title: 'Types' }, { id: 2, title: 'Functions' }] },
      { id: 2, title: 'Built-in Functions', steps: [{ id: 1, title: 'STX Functions' }] },
      { id: 3, title: 'Deploying Contracts', steps: [{ id: 1, title: 'testnet deploy' }] },
    ],
  },
  {
    id: 4, title: 'Build dApps', description: 'Build complete Stacks dApps.',
    lessons: [
      { id: 1, title: 'Stacks JS Basics', steps: [{ id: 1, title: 'Setup' }] },
      { id: 2, title: 'Wallet Authentication', steps: [{ id: 1, title: 'Connect' }] },
      { id: 3, title: 'Connecting Contracts', steps: [{ id: 1, title: 'Calls' }] },
      { id: 4, title: 'Real-world Project', steps: [{ id: 1, title: 'Build' }] },
    ],
  },
  {
    id: 5, title: 'Advanced Smart Contract Patterns', description: 'Master advanced Clarity concepts.',
    lessons: [
      { id: 1, title: 'Advanced Methods', steps: [{ id: 1, title: 'Traits' }] },
      { id: 2, title: 'Security Best Practices', steps: [{ id: 1, title: 'Audits' }] },
      { id: 3, title: 'DeFi Implementations', steps: [{ id: 1, title: 'AMMs' }] },
      { id: 4, title: 'Performance Profiling', steps: [{ id: 1, title: 'Gas' }] },
    ],
  },
  {
    id: 6, title: 'Build Real Projects', description: 'Deploy full-scale ecosystem projects.',
    lessons: [
      { id: 1, title: 'Project Proposal', steps: [{ id: 1, title: 'Scope' }] },
      { id: 2, title: 'DApp Architecture', steps: [{ id: 1, title: 'Design' }] },
      { id: 3, title: 'Final Polish', steps: [{ id: 1, title: 'UX' }] },
      { id: 4, title: 'Mainnet Deployment', steps: [{ id: 1, title: 'Launch' }] },
    ],
  },
];

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  getCurriculum() {
    return CURRICULUM;
  }

  getCourseById(courseId: number) {
    return CURRICULUM.find((c) => c.id === courseId) ?? null;
  }

  async getUserProgress(userId: string, courseId: number) {
    const progressRecords = await this.progressRepo.find({
      where: { userId, courseId },
    });

    const course = this.getCourseById(courseId);
    if (!course) return null;

    return course.lessons.map((lesson) => ({
      ...lesson,
      steps: lesson.steps.map((step) => {
        const record = progressRecords.find(
          (p) => p.lessonId === lesson.id && p.stepId === step.id,
        );
        return { ...step, state: record?.state ?? StepState.LOCKED };
      }),
    }));
  }

  async completeStep(userId: string, courseId: number, lessonId: number, stepId: number) {
    let record = await this.progressRepo.findOne({
      where: { userId, courseId, lessonId, stepId },
    });

    if (!record) {
      record = this.progressRepo.create({ userId, courseId, lessonId, stepId });
    }

    record.state = StepState.COMPLETED;
    record.completedAt = new Date();
    return this.progressRepo.save(record);
  }
}
