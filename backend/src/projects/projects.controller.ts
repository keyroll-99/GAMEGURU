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
import { ProjectsService } from './projects.service';
import {
  CreateProjectDto,
  UpdateProjectDto,
  TransferOwnershipDto,
  InviteMemberDto,
} from './dto';
import { JwtAuthGuard, CurrentUser } from '../auth';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  /**
   * POST /projects - Tworzy nowy projekt
   */
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(userId, createProjectDto);
  }

  /**
   * GET /projects - Lista projektów użytkownika
   */
  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.projectsService.findAllForUser(userId);
  }

  /**
   * GET /projects/:id - Szczegóły projektu
   */
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.findOne(projectId, userId);
  }

  /**
   * PATCH /projects/:id - Edycja projektu (tylko owner)
   */
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(projectId, userId, updateProjectDto);
  }

  /**
   * PATCH /projects/:id/archive - Archiwizacja projektu (tylko owner)
   */
  @Patch(':id/archive')
  archive(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.archive(projectId, userId, true);
  }

  /**
   * PATCH /projects/:id/unarchive - Odarchiwizowanie projektu (tylko owner)
   */
  @Patch(':id/unarchive')
  unarchive(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.archive(projectId, userId, false);
  }

  /**
   * PATCH /projects/:id/transfer-ownership - Przekazanie ownership (tylko owner)
   */
  @Patch(':id/transfer-ownership')
  transferOwnership(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
    @Body() transferDto: TransferOwnershipDto,
  ) {
    return this.projectsService.transferOwnership(
      projectId,
      userId,
      transferDto,
    );
  }

  // ==========================================
  // MEMBERS ENDPOINTS
  // ==========================================

  /**
   * GET /projects/:id/members - Lista członków projektu
   */
  @Get(':id/members')
  getMembers(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.getMembers(projectId, userId);
  }

  /**
   * POST /projects/:id/members - Zaproszenie użytkownika do projektu (tylko owner)
   */
  @Post(':id/members')
  inviteMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
    @Body() inviteDto: InviteMemberDto,
  ) {
    return this.projectsService.inviteMember(projectId, userId, inviteDto);
  }

  /**
   * DELETE /projects/:id/members/me - Opuszczenie projektu (member)
   */
  @Delete(':id/members/me')
  leaveProject(
    @Param('id', ParseUUIDPipe) projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.leaveProject(projectId, userId);
  }

  /**
   * DELETE /projects/:id/members/:userId - Usunięcie członka (tylko owner)
   */
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseUUIDPipe) projectId: string,
    @Param('userId', ParseUUIDPipe) memberIdToRemove: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.projectsService.removeMember(
      projectId,
      userId,
      memberIdToRemove,
    );
  }
}
