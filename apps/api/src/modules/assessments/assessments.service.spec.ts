import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { AssessmentsService } from "./assessments.service";
import { QuizSession } from "@app/database/entities/quiz-session.entity";
import { AiGraderService } from "./grader/ai-grader.service";
import { QuizGeneratorService } from "./generators/quiz-generator.service";
import { XpService } from "../gamification/xp/xp.service";

describe("AssessmentsService", () => {
  let service: AssessmentsService;

  const mockQuizRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockGraderService = {
    grade: jest.fn(),
  };

  const mockGeneratorService = {
    generateQuiz: jest.fn(),
  };

  const mockXpService = {
    award: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === "anthropic.apiKey") return "test-key";
      if (key === "anthropic.model") return "test-model";
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssessmentsService,
        {
          provide: getRepositoryToken(QuizSession),
          useValue: mockQuizRepo,
        },
        {
          provide: AiGraderService,
          useValue: mockGraderService,
        },
        {
          provide: QuizGeneratorService,
          useValue: mockGeneratorService,
        },
        {
          provide: XpService,
          useValue: mockXpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AssessmentsService>(AssessmentsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
