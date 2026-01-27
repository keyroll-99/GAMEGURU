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
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';
import { JwtAuthGuard, CurrentUser } from '../../auth';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('project-notes')
@Controller('projects/:projectId/notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'Pobiera wszystkie notatki projektu' })
  findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.findAll(projectId, userId);
  }

  @Get(':noteId')
  @ApiOperation({ summary: 'Pobiera szczegóły notatki' })
  findOne(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.findOne(projectId, noteId, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tworzy nową notatkę' })
  create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
    @Body() createNoteDto: CreateNoteDto,
  ) {
    return this.notesService.create(projectId, userId, createNoteDto);
  }

  @Patch(':noteId')
  @ApiOperation({ summary: 'Aktualizuje notatkę' })
  update(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @CurrentUser('id') userId: string,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    return this.notesService.update(projectId, noteId, userId, updateNoteDto);
  }

  @Delete(':noteId')
  @ApiOperation({ summary: 'Usuwa notatkę' })
  remove(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.notesService.remove(projectId, noteId, userId);
  }
}
