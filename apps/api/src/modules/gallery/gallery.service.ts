import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GalleryProject, ModerationStatus } from '@app/database/entities/gallery-project.entity';
import { ProjectVote } from '@app/database/entities/project-vote.entity';
import { PaginationDto } from '@app/common/dto/pagination.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectFilterDto } from './dto/project-filter.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryProject)
    private readonly projectRepo: Repository<GalleryProject>,
    @InjectRepository(ProjectVote)
    private readonly voteRepo: Repository<ProjectVote>,
  ) {}

  async findAll(filter: ProjectFilterDto, pagination: PaginationDto) {
    const qb = this.projectRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .where('p.moderation_status = :status', { status: ModerationStatus.APPROVED });

    if (filter.category) {
      qb.andWhere('p.category = :category', { category: filter.category });
    }

    qb.orderBy('p.vote_count', 'DESC').skip(pagination.skip).take(pagination.limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, meta: { total, page: pagination.page, limit: pagination.limit } };
  }

  async create(userId: string, dto: CreateProjectDto) {
    const project = this.projectRepo.create({ userId, ...dto });
    return this.projectRepo.save(project);
  }

  async findOne(id: string) {
    const project = await this.projectRepo.findOne({ where: { id }, relations: ['user'] });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(userId: string, id: string, dto: Partial<CreateProjectDto>) {
    const project = await this.findOne(id);
    if (project.userId !== userId) throw new ForbiddenException('Not your project');
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(userId: string, id: string) {
    const project = await this.findOne(id);
    if (project.userId !== userId) throw new ForbiddenException('Not your project');
    await this.projectRepo.remove(project);
    return { deleted: true };
  }

  async toggleVote(userId: string, projectId: string) {
    const existing = await this.voteRepo.findOne({ where: { userId, projectId } });

    if (existing) {
      await this.voteRepo.remove(existing);
      await this.projectRepo.decrement({ id: projectId }, 'voteCount', 1);
      return { voted: false };
    } else {
      await this.voteRepo.save(this.voteRepo.create({ userId, projectId }));
      await this.projectRepo.increment({ id: projectId }, 'voteCount', 1);
      return { voted: true };
    }
  }
}
