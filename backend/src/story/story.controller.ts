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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StoryService } from './story.service';
import {
  CreateStoryElementDto,
  UpdateStoryElementDto,
  CreateConnectionDto,
  LinkNodeDto,
  RollbackStoryDto,
} from './dto';
import { CurrentUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Story')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  /**
   * GET /projects/:projectId/story - Pobierz całe drzewo fabuły
   */
  @Get('projects/:projectId/story')
  @ApiOperation({ summary: 'Pobierz wszystkie elementy fabuły projektu' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  findAllByProject(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.findAllByProject(projectId, userId);
  }

  /**
   * GET /projects/:projectId/story/graph - Pobierz dane do grafu
   */
  @Get('projects/:projectId/story/graph')
  @ApiOperation({
    summary: 'Pobierz dane do grafu fabuły (elementy + połączenia)',
  })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  getGraphData(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.getGraphData(projectId, userId);
  }

  /**
   * GET /projects/:projectId/story/progress - Statystyki postępu
   */
  @Get('projects/:projectId/story/progress')
  @ApiOperation({ summary: 'Pobierz statystyki postępu fabuły projektu' })
  @ApiParam({ name: 'projectId', type: 'string', format: 'uuid' })
  getProgress(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.getProgress(projectId, userId);
  }

  /**
   * POST /story - Utwórz element fabuły
   */
  @Post('story')
  @ApiOperation({ summary: 'Utwórz nowy element fabuły' })
  create(
    @Body() dto: CreateStoryElementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.create(dto, userId);
  }

  /**
   * GET /story/:id - Szczegóły elementu
   */
  @Get('story/:id')
  @ApiOperation({
    summary: 'Pobierz szczegóły elementu fabuły z children i connections',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.findOne(id, userId);
  }

  /**
   * PATCH /story/:id - Aktualizuj element
   */
  @Patch('story/:id')
  @ApiOperation({
    summary: 'Aktualizuj element fabuły (z zapisem do StoryHistory)',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoryElementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.update(id, dto, userId);
  }

  /**
   * DELETE /story/:id - Usuń element
   */
  @Delete('story/:id')
  @ApiOperation({ summary: 'Usuń element fabuły (cascade dzieci)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.remove(id, userId);
  }

  /**
   * POST /story/:id/connections - Dodaj połączenie między scenami
   */
  @Post('story/:id/connections')
  @ApiOperation({ summary: 'Dodaj połączenie między elementami fabuły' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  createConnection(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateConnectionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.createConnection(id, dto, userId);
  }

  /**
   * DELETE /story/connections/:connectionId - Usuń połączenie
   */
  @Delete('story/connections/:connectionId')
  @ApiOperation({ summary: 'Usuń połączenie między elementami' })
  @ApiParam({ name: 'connectionId', type: 'string', format: 'uuid' })
  removeConnection(
    @Param('connectionId', ParseUUIDPipe) connectionId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.removeConnection(connectionId, userId);
  }

  /**
   * POST /story/:id/link-node - Powiąż element fabuły z taskiem
   */
  @Post('story/:id/link-node')
  @ApiOperation({ summary: 'Powiąż element fabuły z taskiem (Node)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  linkNode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkNodeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.linkNode(id, dto, userId);
  }

  /**
   * DELETE /story/:id/link-node/:nodeId - Usuń powiązanie
   */
  @Delete('story/:id/link-node/:nodeId')
  @ApiOperation({ summary: 'Usuń powiązanie elementu fabuły z taskiem' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'nodeId', type: 'string', format: 'uuid' })
  unlinkNode(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('nodeId', ParseUUIDPipe) nodeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.unlinkNode(id, nodeId, userId);
  }

  /**
   * GET /story/:id/history - Historia zmian elementu
   */
  @Get('story/:id/history')
  @ApiOperation({ summary: 'Pobierz historię zmian elementu fabuły' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.getHistory(id, userId);
  }

  /**
   * POST /story/:id/rollback - Przywróć wersję z historii
   */
  @Post('story/:id/rollback')
  @ApiOperation({
    summary: 'Przywróć wartość pola elementu fabuły z historii zmian',
  })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  rollback(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RollbackStoryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.storyService.rollback(id, dto.historyId, userId);
  }
}
