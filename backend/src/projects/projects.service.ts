import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateProjectDto,
  UpdateProjectDto,
  TransferOwnershipDto,
  InviteMemberDto,
} from './dto';
import { ProjectRole } from '@prisma/client';
import { NodesService } from '../nodes';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => NodesService))
    private readonly nodesService: NodesService,
  ) {}

  /**
   * Tworzy nowy projekt i dodaje właściciela jako członka z rolą OWNER
   */
  async create(userId: string, createProjectDto: CreateProjectDto) {
    const { name, description } = createProjectDto;

    const project = await this.prisma.project.create({
      data: {
        name,
        description,
        owner_id: userId,
        members: {
          create: {
            user_id: userId,
            role: ProjectRole.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar_url: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    // Automatycznie tworzy ROOT node dla projektu
    await this.nodesService.createRootNode(project.id, project.name);

    return {
      message: 'Projekt utworzony pomyślnie',
      project,
    };
  }

  /**
   * Pobiera listę projektów, w których użytkownik jest członkiem
   */
  async findAllForUser(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: {
        members: {
          some: {
            user_id: userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return projects;
  }

  /**
   * Pobiera szczegóły projektu (tylko jeśli użytkownik jest członkiem)
   */
  async findOne(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar_url: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Projekt nie został znaleziony');
    }

    // Sprawdź czy użytkownik jest członkiem projektu
    const isMember = project.members.some((m) => m.user_id === userId);
    if (!isMember) {
      throw new ForbiddenException('Nie masz dostępu do tego projektu');
    }

    return project;
  }

  /**
   * Aktualizuje projekt (tylko owner)
   */
  async update(
    projectId: string,
    userId: string,
    updateProjectDto: UpdateProjectDto,
  ) {
    const project = await this.findOne(projectId, userId);

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Tylko właściciel może edytować projekt');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: updateProjectDto,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    return {
      message: 'Projekt zaktualizowany',
      project: updatedProject,
    };
  }

  /**
   * Archiwizuje/odarchiwizowuje projekt (tylko owner)
   */
  async archive(projectId: string, userId: string, archive: boolean = true) {
    const project = await this.findOne(projectId, userId);

    if (project.owner_id !== userId) {
      throw new ForbiddenException(
        'Tylko właściciel może archiwizować projekt',
      );
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { is_archived: archive },
    });

    return {
      message: archive
        ? 'Projekt został zarchiwizowany'
        : 'Projekt został przywrócony',
      project: updatedProject,
    };
  }

  /**
   * Przekazuje ownership projektu innemu członkowi (tylko owner)
   */
  async transferOwnership(
    projectId: string,
    userId: string,
    transferDto: TransferOwnershipDto,
  ) {
    const { newOwnerId } = transferDto;

    const project = await this.findOne(projectId, userId);

    if (project.owner_id !== userId) {
      throw new ForbiddenException('Tylko właściciel może przekazać projekt');
    }

    if (newOwnerId === userId) {
      throw new BadRequestException(
        'Nie można przekazać projektu samemu sobie',
      );
    }

    // Sprawdź czy nowy owner jest członkiem projektu
    const newOwnerMember = project.members.find(
      (m) => m.user_id === newOwnerId,
    );
    if (!newOwnerMember) {
      throw new BadRequestException(
        'Nowy właściciel musi być członkiem projektu',
      );
    }

    // Transakcja: zmień ownera i role członków
    await this.prisma.$transaction([
      // Zmień owner_id projektu
      this.prisma.project.update({
        where: { id: projectId },
        data: { owner_id: newOwnerId },
      }),
      // Zmień rolę starego ownera na MEMBER
      this.prisma.projectMember.update({
        where: {
          project_id_user_id: {
            project_id: projectId,
            user_id: userId,
          },
        },
        data: { role: ProjectRole.MEMBER },
      }),
      // Zmień rolę nowego ownera na OWNER
      this.prisma.projectMember.update({
        where: {
          project_id_user_id: {
            project_id: projectId,
            user_id: newOwnerId,
          },
        },
        data: { role: ProjectRole.OWNER },
      }),
    ]);

    const updatedProject = await this.findOne(projectId, newOwnerId);

    return {
      message: 'Własność projektu została przekazana',
      project: updatedProject,
    };
  }

  /**
   * Sprawdza czy użytkownik jest członkiem projektu
   */
  async isMember(projectId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });
    return !!member;
  }

  /**
   * Sprawdza czy użytkownik jest ownerem projektu
   */
  async isOwner(projectId: string, userId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { owner_id: true },
    });
    return project?.owner_id === userId;
  }

  // ==========================================
  // MEMBERS MANAGEMENT
  // ==========================================

  /**
   * Pobiera listę członków projektu
   */
  async getMembers(projectId: string, userId: string) {
    // Sprawdź dostęp do projektu
    await this.findOne(projectId, userId);

    const members = await this.prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        joined_at: 'asc',
      },
    });

    return members;
  }

  /**
   * Zaprasza użytkownika do projektu po emailu
   */
  async inviteMember(
    projectId: string,
    userId: string,
    inviteDto: InviteMemberDto,
  ) {
    const { email } = inviteDto;

    const project = await this.findOne(projectId, userId);

    // Tylko owner może zapraszać członków
    if (project.owner_id !== userId) {
      throw new ForbiddenException('Tylko właściciel może zapraszać członków');
    }

    // Znajdź użytkownika po emailu
    const userToInvite = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true,
      },
    });

    if (!userToInvite) {
      throw new NotFoundException(
        'Użytkownik o podanym adresie email nie istnieje',
      );
    }

    // Sprawdź czy użytkownik nie jest już członkiem
    const existingMember = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userToInvite.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('Użytkownik jest już członkiem projektu');
    }

    // Dodaj członka
    const member = await this.prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: userToInvite.id,
        role: ProjectRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    return {
      message: 'Użytkownik został dodany do projektu',
      member,
    };
  }

  /**
   * Usuwa członka z projektu (tylko owner)
   */
  async removeMember(
    projectId: string,
    userId: string,
    memberIdToRemove: string,
  ) {
    const project = await this.findOne(projectId, userId);

    // Tylko owner może usuwać członków
    if (project.owner_id !== userId) {
      throw new ForbiddenException('Tylko właściciel może usuwać członków');
    }

    // Owner nie może usunąć samego siebie
    if (memberIdToRemove === userId) {
      throw new BadRequestException(
        'Właściciel nie może usunąć siebie. Najpierw przekaż własność projektu innemu członkowi.',
      );
    }

    // Sprawdź czy członek istnieje
    const member = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: memberIdToRemove,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Członek nie został znaleziony w projekcie');
    }

    await this.prisma.projectMember.delete({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: memberIdToRemove,
        },
      },
    });

    return {
      message: 'Członek został usunięty z projektu',
    };
  }

  /**
   * Użytkownik opuszcza projekt
   */
  async leaveProject(projectId: string, userId: string) {
    const project = await this.findOne(projectId, userId);

    // Owner nie może opuścić projektu
    if (project.owner_id === userId) {
      throw new BadRequestException(
        'Właściciel nie może opuścić projektu. Najpierw przekaż własność projektu innemu członkowi.',
      );
    }

    await this.prisma.projectMember.delete({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });

    return {
      message: 'Opuściłeś projekt',
    };
  }
}
