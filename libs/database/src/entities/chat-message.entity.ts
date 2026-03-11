import { Column, CreateDateColumn, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import { ChatSession } from './chat-session.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id' })
  sessionId: string;

  @Column({ type: 'enum', enum: MessageRole })
  role: MessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'token_count', nullable: true })
  tokenCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ChatSession, (s) => s.messages)
  @JoinColumn({ name: 'session_id' })
  session: ChatSession;
}
