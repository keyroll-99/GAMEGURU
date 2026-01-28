import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  CreateStoryElementDto,
  UpdateStoryElementDto,
  CreateConnectionDto,
  LinkNodeDto,
} from './dto';
import { StoryElementStatus } from '@prisma/client';

@Injectable()
export class StoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pobiera całe drzewo fabuły dla projektu (płaska lista)
   */
  async findAllByProject(projectId: string, userId: string) {
    await this.validateProjectMembership(projectId, userId);

    return this.prisma.storyElement.findMany({
      where: { project_id: projectId },
      include: {
        linkedNodes: {
          include: {
            node: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [{ parent_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /**
   * Pobiera dane do grafu (elementy + połączenia)
   */
  async getGraphData(projectId: string, userId: string) {
    await this.validateProjectMembership(projectId, userId);

    const elements = await this.prisma.storyElement.findMany({
      where: { project_id: projectId },
      select: {
        id: true,
        parent_id: true,
        type: true,
        status: true,
        title: true,
        order_index: true,
      },
      orderBy: [{ parent_id: 'asc' }, { order_index: 'asc' }],
    });

    const connections = await this.prisma.storyConnection.findMany({
      where: {
        fromElement: { project_id: projectId },
      },
      select: {
        id: true,
        from_element_id: true,
        to_element_id: true,
        label: true,
        connection_type: true,
      },
    });

    return { elements, connections };
  }

  /**
   * Tworzy nowy element fabuły
   */
  async create(dto: CreateStoryElementDto, userId: string) {
    await this.validateProjectMembership(dto.projectId, userId);

    // Jeśli podano parentId, sprawdź czy istnieje i należy do tego samego projektu
    if (dto.parentId) {
      const parentElement = await this.prisma.storyElement.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentElement) {
        throw new NotFoundException('Parent element not found');
      }

      if (parentElement.project_id !== dto.projectId) {
        throw new BadRequestException(
          'Parent element must belong to the same project',
        );
      }
    }

    // Oblicz order_index (następny w kolejności wśród rodzeństwa)
    const maxOrderIndex = await this.prisma.storyElement.aggregate({
      where: {
        parent_id: dto.parentId || null,
        project_id: dto.projectId,
      },
      _max: { order_index: true },
    });

    const orderIndex = (maxOrderIndex._max.order_index ?? -1) + 1;

    return this.prisma.storyElement.create({
      data: {
        project_id: dto.projectId,
        parent_id: dto.parentId,
        type: dto.type,
        title: dto.title,
        content: dto.content,
        metadata: dto.metadata,
        order_index: orderIndex,
      },
      include: {
        linkedNodes: {
          include: {
            node: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Pobiera pojedynczy element fabuły ze szczegółami
   */
  async findOne(elementId: string, userId: string) {
    const element = await this.prisma.storyElement.findUnique({
      where: { id: elementId },
      include: {
        children: {
          orderBy: { order_index: 'asc' },
        },
        connections: {
          include: {
            toElement: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
        connectedBy: {
          include: {
            fromElement: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
        linkedNodes: {
          include: {
            node: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!element) {
      throw new NotFoundException('Story element not found');
    }

    await this.validateProjectMembership(element.project_id, userId);

    return element;
  }

  /**
   * Aktualizuje element fabuły z zapisem do historii
   */
  async update(elementId: string, dto: UpdateStoryElementDto, userId: string) {
    const element = await this.findOne(elementId, userId);

    // Przygotuj wpisy do historii zmian
    const historyEntries: {
      story_element_id: string;
      field_name: string;
      old_value: string | null;
      new_value: string | null;
      changed_by: string;
    }[] = [];

    if (dto.title !== undefined && dto.title !== element.title) {
      historyEntries.push({
        story_element_id: elementId,
        field_name: 'title',
        old_value: element.title,
        new_value: dto.title,
        changed_by: userId,
      });
    }

    if (dto.content !== undefined && dto.content !== element.content) {
      historyEntries.push({
        story_element_id: elementId,
        field_name: 'content',
        old_value: element.content,
        new_value: dto.content,
        changed_by: userId,
      });
    }

    if (dto.status !== undefined && dto.status !== element.status) {
      historyEntries.push({
        story_element_id: elementId,
        field_name: 'status',
        old_value: element.status,
        new_value: dto.status,
        changed_by: userId,
      });
    }

    if (dto.metadata !== undefined) {
      const oldMetadata = JSON.stringify(element.metadata);
      const newMetadata = JSON.stringify(dto.metadata);
      if (oldMetadata !== newMetadata) {
        historyEntries.push({
          story_element_id: elementId,
          field_name: 'metadata',
          old_value: oldMetadata === 'null' ? null : oldMetadata,
          new_value: newMetadata === 'null' ? null : newMetadata,
          changed_by: userId,
        });
      }
    }

    // Zapisz historię i zaktualizuj element w transakcji
    return this.prisma.$transaction(async (tx) => {
      if (historyEntries.length > 0) {
        await tx.storyHistory.createMany({
          data: historyEntries,
        });
      }

      return tx.storyElement.update({
        where: { id: elementId },
        data: {
          title: dto.title,
          content: dto.content,
          status: dto.status,
          metadata: dto.metadata,
          order_index: dto.orderIndex,
        },
        include: {
          linkedNodes: {
            include: {
              node: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Usuwa element fabuły (cascade usuwa dzieci)
   */
  async remove(elementId: string, userId: string) {
    await this.findOne(elementId, userId);

    await this.prisma.storyElement.delete({
      where: { id: elementId },
    });

    return { message: 'Story element deleted successfully' };
  }

  /**
   * Tworzy połączenie między elementami fabuły
   */
  async createConnection(
    fromElementId: string,
    dto: CreateConnectionDto,
    userId: string,
  ) {
    const fromElement = await this.findOne(fromElementId, userId);

    // Sprawdź czy element docelowy istnieje i należy do tego samego projektu
    const toElement = await this.prisma.storyElement.findUnique({
      where: { id: dto.toElementId },
    });

    if (!toElement) {
      throw new NotFoundException('Target element not found');
    }

    if (toElement.project_id !== fromElement.project_id) {
      throw new BadRequestException(
        'Both elements must belong to the same project',
      );
    }

    // Sprawdź czy połączenie już nie istnieje
    const existingConnection = await this.prisma.storyConnection.findUnique({
      where: {
        from_element_id_to_element_id: {
          from_element_id: fromElementId,
          to_element_id: dto.toElementId,
        },
      },
    });

    if (existingConnection) {
      throw new BadRequestException('Connection already exists');
    }

    return this.prisma.storyConnection.create({
      data: {
        from_element_id: fromElementId,
        to_element_id: dto.toElementId,
        label: dto.label,
        connection_type: dto.connectionType || 'leads_to',
      },
      include: {
        fromElement: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        toElement: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
    });
  }

  /**
   * Usuwa połączenie między elementami
   */
  async removeConnection(connectionId: string, userId: string) {
    const connection = await this.prisma.storyConnection.findUnique({
      where: { id: connectionId },
      include: {
        fromElement: true,
      },
    });

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    await this.validateProjectMembership(
      connection.fromElement.project_id,
      userId,
    );

    await this.prisma.storyConnection.delete({
      where: { id: connectionId },
    });

    return { message: 'Connection deleted successfully' };
  }

  /**
   * Powiązuje element fabuły z taskiem
   */
  async linkNode(elementId: string, dto: LinkNodeDto, userId: string) {
    const element = await this.findOne(elementId, userId);

    // Sprawdź czy node istnieje i należy do tego samego projektu
    const node = await this.prisma.node.findUnique({
      where: { id: dto.nodeId },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    if (node.project_id !== element.project_id) {
      throw new BadRequestException(
        'Node must belong to the same project as the story element',
      );
    }

    // Sprawdź czy powiązanie już nie istnieje
    const existingLink = await this.prisma.nodeStoryLink.findUnique({
      where: {
        node_id_story_element_id: {
          node_id: dto.nodeId,
          story_element_id: elementId,
        },
      },
    });

    if (existingLink) {
      throw new BadRequestException('Link already exists');
    }

    await this.prisma.nodeStoryLink.create({
      data: {
        node_id: dto.nodeId,
        story_element_id: elementId,
      },
    });

    return this.findOne(elementId, userId);
  }

  /**
   * Usuwa powiązanie elementu fabuły z taskiem
   */
  async unlinkNode(elementId: string, nodeId: string, userId: string) {
    await this.findOne(elementId, userId);

    const link = await this.prisma.nodeStoryLink.findUnique({
      where: {
        node_id_story_element_id: {
          node_id: nodeId,
          story_element_id: elementId,
        },
      },
    });

    if (!link) {
      throw new NotFoundException('Link not found');
    }

    await this.prisma.nodeStoryLink.delete({
      where: {
        node_id_story_element_id: {
          node_id: nodeId,
          story_element_id: elementId,
        },
      },
    });

    return { message: 'Link removed successfully' };
  }

  /**
   * Pobiera historię zmian elementu
   */
  async getHistory(elementId: string, userId: string) {
    await this.findOne(elementId, userId);

    return this.prisma.storyHistory.findMany({
      where: { story_element_id: elementId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        },
      },
      orderBy: { changed_at: 'desc' },
    });
  }

  /**
   * Przywraca wartość pola na podstawie wpisu historii
   */
  async rollback(elementId: string, historyId: string, userId: string) {
    const element = await this.findOne(elementId, userId);

    // Pobierz wpis historii
    const historyEntry = await this.prisma.storyHistory.findUnique({
      where: { id: historyId },
    });

    if (!historyEntry) {
      throw new NotFoundException('History entry not found');
    }

    // Sprawdź czy wpis należy do tego elementu
    if (historyEntry.story_element_id !== elementId) {
      throw new BadRequestException(
        'History entry does not belong to this element',
      );
    }

    const fieldName = historyEntry.field_name;
    const oldValue = historyEntry.old_value;

    // Przygotuj dane do rollbacku
    const updateData: any = {};

    if (fieldName === 'title') {
      updateData.title = oldValue;
    } else if (fieldName === 'content') {
      updateData.content = oldValue;
    } else if (fieldName === 'status') {
      // Walidacja enuma StoryElementStatus
      if (
        oldValue &&
        !Object.values(StoryElementStatus).includes(
          oldValue as StoryElementStatus,
        )
      ) {
        throw new BadRequestException('Invalid status value in history');
      }
      updateData.status = oldValue;
    } else if (fieldName === 'metadata') {
      if (oldValue) {
        try {
          const parsedMetadata = JSON.parse(oldValue);
          updateData.metadata = parsedMetadata;
        } catch (e) {
          throw new BadRequestException('Invalid metadata JSON in history');
        }
      } else {
        updateData.metadata = null;
      }
    } else {
      throw new BadRequestException(`Cannot rollback field: ${fieldName}`);
    }

    // Pobierz aktualną wartość pola
    const currentValue =
      fieldName === 'metadata'
        ? element.metadata
          ? JSON.stringify(element.metadata)
          : null
        : (element as any)[fieldName];

    // Wykonaj rollback i zapisz nowy wpis historii w transakcji
    return this.prisma.$transaction(async (tx) => {
      // Utwórz nowy wpis historii opisujący rollback
      await tx.storyHistory.create({
        data: {
          story_element_id: elementId,
          field_name: fieldName,
          old_value:
            fieldName === 'metadata'
              ? currentValue
              : currentValue !== null && currentValue !== undefined
                ? String(currentValue)
                : null,
          new_value:
            fieldName === 'metadata'
              ? oldValue
              : oldValue !== null && oldValue !== undefined
                ? String(oldValue)
                : null,
          changed_by: userId,
        },
      });

      // Zaktualizuj element
      return tx.storyElement.update({
        where: { id: elementId },
        data: updateData,
        include: {
          linkedNodes: {
            include: {
              node: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Pobiera statystyki postępu projektu
   */
  async getProgress(projectId: string, userId: string) {
    await this.validateProjectMembership(projectId, userId);

    const elements = await this.prisma.storyElement.findMany({
      where: { project_id: projectId },
      select: {
        type: true,
        status: true,
      },
    });

    // Grupuj po typie
    const byType = elements.reduce(
      (acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Zlicz ukończone per typ
    const completedByType = elements
      .filter((el) => el.status === StoryElementStatus.COMPLETED)
      .reduce(
        (acc, el) => {
          acc[el.type] = (acc[el.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    // Ogólne statystyki
    const total = elements.length;
    const completed = elements.filter(
      (el) => el.status === StoryElementStatus.COMPLETED,
    ).length;
    const inProgress = elements.filter(
      (el) => el.status === StoryElementStatus.IN_PROGRESS,
    ).length;
    const draft = elements.filter(
      (el) => el.status === StoryElementStatus.DRAFT,
    ).length;
    const review = elements.filter(
      (el) => el.status === StoryElementStatus.REVIEW,
    ).length;

    // Statystyki dla scen (Phase 4 requirement)
    const scenes = elements.filter((el) => el.type === 'SCENE');
    const total_scenes = scenes.length;
    const completed_scenes = scenes.filter(
      (el) => el.status === StoryElementStatus.COMPLETED,
    ).length;
    const percent = total_scenes > 0 
      ? Math.round((completed_scenes / total_scenes) * 100) 
      : 0;

    return {
      total,
      byStatus: {
        completed,
        inProgress,
        draft,
        review,
      },
      byType,
      completedByType,
      completionPercentage:
        total > 0 ? Math.round((completed / total) * 100) : 0,
      // Phase 4: Scene-specific progress metrics
      total_scenes,
      completed_scenes,
      percent,
    };
  }

  /**
   * Sprawdza czy użytkownik jest członkiem projektu
   */
  private async validateProjectMembership(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    return membership;
  }
}
