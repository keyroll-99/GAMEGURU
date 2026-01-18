import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { NodesService } from './nodes.service';
import {
  CreateNodeDto,
  UpdateNodeDto,
  MoveNodeDto,
  AddAssigneeDto,
  ReorderChildrenDto,
} from './dto';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';

@Controller()
@UseGuards(JwtAuthGuard)
export class NodesController {
  constructor(private readonly nodesService: NodesService) {}

  /**
   * GET /projects/:projectId/nodes - pobiera wszystkie węzły projektu
   */
  @Get('projects/:projectId/nodes')
  findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.findAllByProject(projectId, userId);
  }

  /**
   * POST /nodes - tworzy nowy węzeł
   */
  @Post('nodes')
  create(@Body() dto: CreateNodeDto, @CurrentUser('id') userId: string) {
    return this.nodesService.create(dto, userId);
  }

  /**
   * GET /nodes/:id - pobiera pojedynczy węzeł
   */
  @Get('nodes/:id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.findOne(id, userId);
  }

  /**
   * PATCH /nodes/:id - aktualizuje węzeł
   */
  @Patch('nodes/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateNodeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.update(id, dto, userId);
  }

  /**
   * DELETE /nodes/:id - usuwa węzeł
   */
  @Delete('nodes/:id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.remove(id, userId);
  }

  /**
   * PATCH /nodes/:id/move - przenosi węzeł (drag & drop)
   */
  @Patch('nodes/:id/move')
  move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveNodeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.move(id, dto, userId);
  }

  /**
   * PATCH /nodes/:id/reorder-children - zmienia kolejność dzieci węzła
   */
  @Patch('nodes/:id/reorder-children')
  reorderChildren(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderChildrenDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.reorderChildren(id, dto, userId);
  }

  /**
   * POST /nodes/:id/assignees - dodaje przypisanego użytkownika
   */
  @Post('nodes/:id/assignees')
  addAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddAssigneeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.addAssignee(id, dto.userId, userId);
  }

  /**
   * DELETE /nodes/:id/assignees/:userId - usuwa przypisanego użytkownika
   */
  @Delete('nodes/:id/assignees/:userId')
  removeAssignee(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) assigneeUserId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.removeAssignee(id, assigneeUserId, userId);
  }

  /**
   * GET /nodes/:id/history - pobiera historię zmian (tylko ROOT)
   */
  @Get('nodes/:id/history')
  getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.nodesService.getHistory(id, userId);
  }
}
