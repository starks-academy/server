import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProgress, StepState } from '@app/database/entities/user-progress.entity';
import { User } from '@app/database/entities/user.entity';
import { ChatSession } from '@app/database/entities/chat-session.entity';

const MODULE_NAMES: Record<number, string> = {
  1: 'Bitcoin Fundamentals',
  2: 'Introduction to Stacks',
  3: 'Clarity Smart Contracts',
  4: 'Build dApps',
  5: 'Advanced Smart Contract Patterns',
  6: 'Build Real Projects',
  // 7: 'General'
};

@Injectable()
export class PromptBuilderService {
  constructor(
    @InjectRepository(UserProgress)
    private readonly progressRepo: Repository<UserProgress>,
  ) {}

  async build(user: User, session: ChatSession): Promise<string> {
    const completedSteps = await this.progressRepo.count({
      where: { userId: user.id, state: StepState.COMPLETED },
    });

    const currentModule = session.currentCourseId
      ? `Module ${session.currentCourseId}: ${MODULE_NAMES[session.currentCourseId] ?? 'Unknown'}`
      : 'Introduction';

    return `You are an expert Stacks and Bitcoin L2 mentor on the Stacks Academy platform.

Student Context:
- Current lesson: ${currentModule}
- Total steps completed: ${completedSteps}
- Level: ${user.level}
- XP: ${user.xpTotal}

Your role:
- Explain Stacks, Bitcoin L2, and Clarity concepts clearly and concisely
- Provide Clarity code examples when relevant (use \`\`\`clarity\`\`\` code blocks)
- Debug code pasted by the student with line-by-line feedback
- Generate custom practice questions when asked
- Always encourage and stay pedagogical — never just give answers, guide the student
- If the student asks about something outside Stacks/Bitcoin/Clarity, gently redirect them

Tone: Friendly, encouraging, technically accurate. Suitable for beginners but able to go deep.`;
  }
}
