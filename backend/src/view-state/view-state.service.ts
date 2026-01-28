import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { SaveViewStateDto } from './dto'

@Injectable()
export class ViewStateService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user's view state for a project
   */
  async getViewState(userId: string, projectId: string) {
    return this.prisma.userViewState.findUnique({
      where: {
        user_id_project_id: {
          user_id: userId,
          project_id: projectId,
        },
      },
    })
  }

  /**
   * Save or update user's view state for a project
   */
  async saveViewState(userId: string, dto: SaveViewStateDto) {
    const { projectId, viewType, zoom, panX, panY, expandedNodes } = dto

    // Build update data - only include fields that are provided
    const updateData: any = {}
    if (viewType !== undefined) updateData.view_type = viewType
    if (zoom !== undefined) updateData.zoom = zoom
    if (panX !== undefined) updateData.pan_x = panX
    if (panY !== undefined) updateData.pan_y = panY
    if (expandedNodes !== undefined) updateData.expanded_nodes = expandedNodes

    return this.prisma.userViewState.upsert({
      where: {
        user_id_project_id: {
          user_id: userId,
          project_id: projectId,
        },
      },
      create: {
        user_id: userId,
        project_id: projectId,
        view_type: viewType || 'mindmap',
        zoom: zoom || 1.0,
        pan_x: panX || 50.0,
        pan_y: panY || 50.0,
        expanded_nodes: expandedNodes || [],
      },
      update: updateData,
    })
  }

  /**
   * Delete user's view state for a project
   */
  async deleteViewState(userId: string, projectId: string) {
    return this.prisma.userViewState.delete({
      where: {
        user_id_project_id: {
          user_id: userId,
          project_id: projectId,
        },
      },
    })
  }
}
