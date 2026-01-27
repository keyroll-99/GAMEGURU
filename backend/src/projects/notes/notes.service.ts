import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateNoteDto, UpdateNoteDto } from './dto';
import { ProjectsService } from '../projects.service';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
  ) {}

  async findAll(projectId: string, userId: string) {
    const isMember = await this.projectsService.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenException('Nie masz dostępu do tego projektu');
    }

    return this.prisma.projectNote.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(projectId: string, noteId: string, userId: string) {
    const isMember = await this.projectsService.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenException('Nie masz dostępu do tego projektu');
    }

    const note = await this.prisma.projectNote.findUnique({
      where: { id: noteId },
    });

    if (!note || note.project_id !== projectId) {
      throw new NotFoundException('Notatka nie została znaleziona');
    }

    return note;
  }

  async create(
    projectId: string,
    userId: string,
    createNoteDto: CreateNoteDto,
  ) {
    const isMember = await this.projectsService.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenException('Nie masz dostępu do tego projektu');
    }

    return this.prisma.projectNote.create({
      data: {
        ...createNoteDto,
        project_id: projectId,
      },
    });
  }

  async update(
    projectId: string,
    noteId: string,
    userId: string,
    updateNoteDto: UpdateNoteDto,
  ) {
    const note = await this.findOne(projectId, noteId, userId);

    return this.prisma.projectNote.update({
      where: { id: noteId },
      data: updateNoteDto,
    });
  }

  async remove(projectId: string, noteId: string, userId: string) {
    const note = await this.findOne(projectId, noteId, userId);

    await this.prisma.projectNote.delete({
      where: { id: noteId },
    });

    return { message: 'Notatka została usunięta' };
  }
}
