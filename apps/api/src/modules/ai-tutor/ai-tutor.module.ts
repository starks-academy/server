import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatSession } from '@app/database/entities/chat-session.entity';
import { ChatMessage } from '@app/database/entities/chat-message.entity';
import { UserProgress } from '@app/database/entities/user-progress.entity';
import { AiTutorController } from './ai-tutor.controller';
import { AiTutorService } from './ai-tutor.service';
import { PromptBuilderService } from './prompt-builder/prompt-builder.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatSession, ChatMessage, UserProgress])],
  controllers: [AiTutorController],
  providers: [AiTutorService, PromptBuilderService],
})
export class AiTutorModule {}
