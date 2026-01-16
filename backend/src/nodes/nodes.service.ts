import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateNodeDto, UpdateNodeDto, MoveNodeDto } from './dto';
import { NodeType } from '@prisma/client';

@Injectable()
export class NodesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pobiera wszystkie węzły projektu (płaska lista)
   */
  async findAllByProject(projectId: string, userId: string) {
    // Sprawdź czy user jest członkiem projektu
    await this.validateProjectMembership(projectId, userId);

    return this.prisma.node.findMany({
      where: { project_id: projectId },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: [{ parent_id: 'asc' }, { order_index: 'asc' }],
    });
  }

  /**
   * Pobiera pojedynczy węzeł
   */
  async findOne(nodeId: string, userId: string) {
    const node = await this.prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
        children: true,
      },
    });

    if (!node) {
      throw new NotFoundException('Node not found');
    }

    // Sprawdź czy user jest członkiem projektu
    await this.validateProjectMembership(node.project_id, userId);

    return node;
  }

  /**
   * Tworzy nowy węzeł
   */
  async create(dto: CreateNodeDto, userId: string) {
    // Sprawdź czy user jest członkiem projektu
    await this.validateProjectMembership(dto.projectId, userId);

    // Jeśli podano parentId, sprawdź czy istnieje i należy do tego samego projektu
    if (dto.parentId) {
      const parentNode = await this.prisma.node.findUnique({
        where: { id: dto.parentId },
      });

      if (!parentNode) {
        throw new NotFoundException('Parent node not found');
      }

      if (parentNode.project_id !== dto.projectId) {
        throw new BadRequestException(
          'Parent node must belong to the same project',
        );
      }
    } else {
      // Jeśli nie podano parentId, sprawdź czy istnieje ROOT dla projektu
      const rootNode = await this.prisma.node.findFirst({
        where: {
          project_id: dto.projectId,
          type: NodeType.ROOT,
        },
      });

      if (!rootNode) {
        // Jeśli nie ma ROOTa, tworzymy go jako ROOT
        dto.type = NodeType.ROOT;
        // parentId pozostaje undefined/null
      } else {
        // Domyślnie podepnij pod ROOTa
        dto.parentId = rootNode.id;
      }
    }

    // Oblicz order_index (następny w kolejności wśród rodzeństwa)
    const maxOrderIndex = await this.prisma.node.aggregate({
      where: { 
        parent_id: dto.parentId || null,
        project_id: dto.projectId
      },
      _max: { order_index: true },
    });

    const orderIndex = (maxOrderIndex._max.order_index ?? -1) + 1;

    return this.prisma.node.create({
      data: {
        project_id: dto.projectId,
        parent_id: dto.parentId,
        title: dto.title,
        type: dto.type ?? NodeType.TASK,
        description: dto.description,
        order_index: orderIndex,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Tworzy ROOT node dla projektu (wywoływane przy tworzeniu projektu)
   */
  async createRootNode(projectId: string, projectName: string) {
    return this.prisma.node.create({
      data: {
        project_id: projectId,
        title: projectName,
        type: NodeType.ROOT,
        order_index: 0,
      },
    });
  }

  /**
   * Aktualizuje węzeł
   */
  async update(nodeId: string, dto: UpdateNodeDto, userId: string) {
    const node = await this.findOne(nodeId, userId);

    // Dla ROOT zapisz historię zmian
    if (node.type === NodeType.ROOT) {
      const historyEntries: {
        node_id: string;
        field_name: string;
        old_value: string | null;
        new_value: string | null;
        changed_by: string;
      }[] = [];

      if (dto.title !== undefined && dto.title !== node.title) {
        historyEntries.push({
          node_id: nodeId,
          field_name: 'title',
          old_value: node.title,
          new_value: dto.title,
          changed_by: userId,
        });
      }

      if (dto.description !== undefined && dto.description !== node.description) {
        historyEntries.push({
          node_id: nodeId,
          field_name: 'description',
          old_value: node.description,
          new_value: dto.description,
          changed_by: userId,
        });
      }

      if (historyEntries.length > 0) {
        await this.prisma.nodeHistory.createMany({
          data: historyEntries,
        });
      }
    }

    return this.prisma.node.update({
      where: { id: nodeId },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Usuwa węzeł (cascade usuwa dzieci)
   */
  async remove(nodeId: string, userId: string) {
    const node = await this.findOne(nodeId, userId);

    // Nie można usunąć ROOT
    if (node.type === NodeType.ROOT) {
      throw new BadRequestException('Cannot delete ROOT node');
    }

    await this.prisma.node.delete({
      where: { id: nodeId },
    });

    return { message: 'Node deleted successfully' };
  }

  /**
   * Przenosi węzeł (drag & drop)
   */
  async move(nodeId: string, dto: MoveNodeDto, userId: string) {
    const node = await this.findOne(nodeId, userId);

    // Nie można przenosić ROOT
    if (node.type === NodeType.ROOT) {
      throw new BadRequestException('Cannot move ROOT node');
    }

    // Jeśli podano nowego rodzica, waliduj
    if (dto.newParentId) {
      const newParent = await this.prisma.node.findUnique({
        where: { id: dto.newParentId },
      });

      if (!newParent) {
        throw new NotFoundException('New parent node not found');
      }

      if (newParent.project_id !== node.project_id) {
        throw new BadRequestException(
          'New parent must belong to the same project',
        );
      }

      // Sprawdź czy nie próbujemy przenieść węzła do swojego potomka
      const isDescendant = await this.isDescendant(dto.newParentId, nodeId);
      if (isDescendant) {
        throw new BadRequestException('Cannot move node to its own descendant');
      }
    }

    const newParentId = dto.newParentId ?? node.parent_id;

    // Przesuń rodzeństwo, żeby zrobić miejsce
    await this.prisma.node.updateMany({
      where: {
        parent_id: newParentId,
        order_index: { gte: dto.newOrderIndex },
        id: { not: nodeId },
      },
      data: {
        order_index: { increment: 1 },
      },
    });

    // Zaktualizuj węzeł
    return this.prisma.node.update({
      where: { id: nodeId },
      data: {
        parent_id: newParentId,
        order_index: dto.newOrderIndex,
      },
      include: {
        assignees: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Dodaje przypisanego użytkownika do węzła
   */
  async addAssignee(nodeId: string, assigneeUserId: string, userId: string) {
    const node = await this.findOne(nodeId, userId);

    // Sprawdź czy assignee jest członkiem projektu
    const isMember = await this.prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
          project_id: node.project_id,
          user_id: assigneeUserId,
        },
      },
    });

    if (!isMember) {
      throw new BadRequestException('User must be a project member');
    }

    // Sprawdź czy już nie jest przypisany
    const existingAssignment = await this.prisma.nodeAssignee.findUnique({
      where: {
        node_id_user_id: {
          node_id: nodeId,
          user_id: assigneeUserId,
        },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('User is already assigned to this node');
    }

    await this.prisma.nodeAssignee.create({
      data: {
        node_id: nodeId,
        user_id: assigneeUserId,
      },
    });

    return this.findOne(nodeId, userId);
  }

  /**
   * Usuwa przypisanego użytkownika z węzła
   */
  async removeAssignee(nodeId: string, assigneeUserId: string, userId: string) {
    await this.findOne(nodeId, userId);

    await this.prisma.nodeAssignee.delete({
      where: {
        node_id_user_id: {
          node_id: nodeId,
          user_id: assigneeUserId,
        },
      },
    });

    return { message: 'Assignee removed successfully' };
  }

  /**
   * Pobiera historię zmian węzła (tylko dla ROOT)
   */
  async getHistory(nodeId: string, userId: string) {
    const node = await this.findOne(nodeId, userId);

    if (node.type !== NodeType.ROOT) {
      throw new BadRequestException('History is only available for ROOT nodes');
    }

    return this.prisma.nodeHistory.findMany({
      where: { node_id: nodeId },
      include: {
        changer: {
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

  /**
   * Sprawdza czy potentialDescendantId jest potomkiem ancestorId
   */
  private async isDescendant(
    potentialDescendantId: string,
    ancestorId: string,
  ): Promise<boolean> {
    let currentId: string | null = potentialDescendantId;

    while (currentId) {
      if (currentId === ancestorId) {
        return true;
      }

      const node = await this.prisma.node.findUnique({
        where: { id: currentId },
        select: { parent_id: true },
      });

      currentId = node?.parent_id ?? null;
    }

    return false;
  }
}
