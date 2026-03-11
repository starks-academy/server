import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

import { ChatSession } from '@app/database/entities/chat-session.entity';
import { ChatMessage, MessageRole } from '@app/database/entities/chat-message.entity';
import { User } from '@app/database/entities/user.entity';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';
import { ChatMessageDto } from './dto/chat-message.dto';

@Injectable()
export class AiTutorService {
  private readonly anthropic: Anthropic;

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    private readonly promptBuilder: PromptBuilderService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({ apiKey: this.config.get('anthropic.apiKey') });
  }

  async chat(user: User, dto: ChatMessageDto) {
    // Get or create session
    let session: ChatSession;
    if (dto.sessionId) {
      session = await this.sessionRepo.findOne({
        where: { id: dto.sessionId, userId: user.id },
        relations: ['messages'],
      });
    }

    if (!session) {
      session = await this.sessionRepo.save(
        this.sessionRepo.create({
          userId: user.id,
          title: dto.message.slice(0, 60),
          currentCourseId: dto.currentCourseId,
          currentLessonId: dto.currentLessonId,
        }),
      );
      session.messages = [];
    }

    // Build context-aware system prompt
    const systemPrompt = await this.promptBuilder.build(user, session);

    // Build Claude message history
    const history: Anthropic.MessageParam[] = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    history.push({ role: 'user', content: dto.message });

    const response = await this.anthropic.messages.create({
      model: this.config.get('anthropic.model'),
      max_tokens: this.config.get('anthropic.maxTokens'),
      system: systemPrompt,
      messages: history,
    });

    const assistantContent = (response.content[0] as Anthropic.TextBlock).text;

    // Persist messages
    await this.messageRepo.save([
      this.messageRepo.create({ sessionId: session.id, role: MessageRole.USER, content: dto.message }),
      this.messageRepo.create({ sessionId: session.id, role: MessageRole.ASSISTANT, content: assistantContent }),
    ]);

    return { sessionId: session.id, message: assistantContent };
  }

  async getSessions(userId: string) {
    return this.sessionRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      take: 20,
    });
  }

  async getSession(userId: string, sessionId: string) {
    return this.sessionRepo.findOne({
      where: { id: sessionId, userId },
      relations: ['messages'],
    });
  }

  async deleteSession(userId: string, sessionId: string) {
    await this.sessionRepo.delete({ id: sessionId, userId });
    return { deleted: true };
  }
}
