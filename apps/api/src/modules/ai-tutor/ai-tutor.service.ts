import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";

import { ChatSession } from "@app/database/entities/chat-session.entity";
import {
  ChatMessage,
  MessageRole,
} from "@app/database/entities/chat-message.entity";
import { User } from "@app/database/entities/user.entity";
import { PromptBuilderService } from "./prompt-builder/prompt-builder.service";
import { ChatMessageDto } from "./dto/chat-message.dto";
import {
  GeneratePracticeQuizDto,
  PracticeModule,
  PracticeQuizFormat,
} from "./dto/practice-quiz.dto";
import { SubmitPracticeAnswerDto } from "./dto/submit-practice-answer.dto";

const MODULE_TOPICS: Record<number, string> = {
  0: "General Stacks and Bitcoin knowledge covering all modules",
  1: "Bitcoin Fundamentals - Bitcoin basics, blockchain, mining, transactions, UTXOs",
  2: "Introduction to Stacks - Stacks blockchain, Proof of Transfer, STX token, microblocks",
  3: "Clarity Smart Contracts - Clarity language syntax, data types, functions, traits",
  4: "Build dApps - Frontend integration, wallet connection, contract interaction",
  5: "Advanced Smart Contract Patterns - Security, upgradability, composability, best practices",
  6: "Build Real Projects - DeFi protocols, NFTs, DAOs, real-world applications",
};

@Injectable()
export class AiTutorService {
  private readonly anthropic: Anthropic;
  private readonly logger = new Logger(AiTutorService.name);

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionRepo: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    private readonly promptBuilder: PromptBuilderService,
    private readonly config: ConfigService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: this.config.get("anthropic.apiKey"),
    });
  }

  async chat(user: User, dto: ChatMessageDto) {
    // Get or create session
    let session: ChatSession;
    if (dto.sessionId) {
      session = await this.sessionRepo.findOne({
        where: { id: dto.sessionId, userId: user.id },
        relations: ["messages"],
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
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    history.push({ role: "user", content: dto.message });

    const response = await this.anthropic.messages.create({
      model: this.config.get("anthropic.model"),
      max_tokens: this.config.get("anthropic.maxTokens"),
      system: systemPrompt,
      messages: history,
    });

    const assistantContent = (response.content[0] as Anthropic.TextBlock).text;

    // Persist messages
    await this.messageRepo.save([
      this.messageRepo.create({
        sessionId: session.id,
        role: MessageRole.USER,
        content: dto.message,
      }),
      this.messageRepo.create({
        sessionId: session.id,
        role: MessageRole.ASSISTANT,
        content: assistantContent,
      }),
    ]);

    return { sessionId: session.id, message: assistantContent };
  }

  async getSessions(userId: string) {
    return this.sessionRepo.find({
      where: { userId },
      order: { updatedAt: "DESC" },
      take: 20,
    });
  }

  async getSession(userId: string, sessionId: string) {
    return this.sessionRepo.findOne({
      where: { id: sessionId, userId },
      relations: ["messages"],
    });
  }

  async deleteSession(userId: string, sessionId: string) {
    await this.sessionRepo.delete({ id: sessionId, userId });
    return { deleted: true };
  }

  /**
   * Generate practice quiz questions without tracking progress
   */
  async generatePracticeQuiz(dto: GeneratePracticeQuizDto) {
    const topic =
      dto.module === PracticeModule.GENERAL
        ? "General Stacks and Bitcoin knowledge covering all modules"
        : MODULE_TOPICS[dto.module];

    const prompt = this.buildPracticeQuizPrompt(
      topic,
      dto.format,
      dto.questionCount,
    );

    try {
      const response = await this.anthropic.messages.create({
        model: this.config.get("anthropic.model"),
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });

      const rawText = (response.content[0] as Anthropic.TextBlock).text;
      const questions = this.parseQuestions(rawText);

      this.logger.debug(
        `Generated ${questions.length} practice questions for module ${dto.module}`,
      );

      return { questions };
    } catch (error) {
      this.logger.error("Failed to generate practice quiz", error);
      throw new Error(`Practice quiz generation failed: ${error.message}`);
    }
  }

  /**
   * Check answer and provide feedback without tracking progress
   */
  async checkPracticeAnswer(dto: SubmitPracticeAnswerDto) {
    const prompt = `You are a helpful tutor. A student answered the following question:

Question: ${dto.question}
Question Type: ${dto.questionType}
Student's Answer: ${dto.answer}

Provide feedback on their answer:
- If it's a multiple-choice question, tell them if they're correct or incorrect
- If it's an open-ended question, evaluate their understanding and provide constructive feedback
- Keep feedback encouraging and educational
- If incorrect, explain why and provide the correct answer or guidance

Respond in JSON format:
{
  "isCorrect": true/false,
  "feedback": "your feedback here",
  "explanation": "detailed explanation if needed"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.config.get("anthropic.model"),
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const rawText = (response.content[0] as Anthropic.TextBlock).text;
      const cleanedText = rawText
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
      const result = JSON.parse(cleanedText);

      return result;
    } catch (error) {
      this.logger.error("Failed to check practice answer", error);
      throw new Error(`Answer checking failed: ${error.message}`);
    }
  }

  private buildPracticeQuizPrompt(
    topic: string,
    format: PracticeQuizFormat,
    count: number,
  ): string {
    const formatInstructions = {
      [PracticeQuizFormat.MULTIPLE_CHOICE]:
        "Generate ONLY multiple-choice questions.",
      [PracticeQuizFormat.OPEN_ENDED]: "Generate ONLY open-ended questions.",
      [PracticeQuizFormat.MIXED]:
        "Generate a mix of multiple-choice and open-ended questions.",
    };

    return `Generate ${count} practice quiz questions about: ${topic}

${formatInstructions[format]}

Return a JSON array of questions. Each question must follow this structure:

For multiple-choice questions:
{
  "id": "unique-id",
  "type": "multiple-choice",
  "question": "Question text",
  "options": [
    {"id": "a", "text": "Option A"},
    {"id": "b", "text": "Option B"},
    {"id": "c", "text": "Option C"},
    {"id": "d", "text": "Option D"}
  ],
  "correctOptionId": "a"
}

For open-ended questions:
{
  "id": "unique-id",
  "type": "open-ended",
  "question": "Question text",
  "modelAnswer": "Expected answer or key points"
}

Requirements:
- Questions should be educational and test understanding
- Multiple-choice options should be plausible but have one clearly correct answer
- Open-ended questions should encourage critical thinking
- Cover different difficulty levels
- Return ONLY the JSON array, no additional text`;
  }

  private parseQuestions(rawText: string): any[] {
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
    }

    try {
      const parsed = JSON.parse(cleanedText);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      this.logger.error("Failed to parse AI response", error);
      throw new Error("Failed to generate valid quiz questions");
    }
  }
}
