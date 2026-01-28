import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ViewStateService } from './view-state.service'
import { SaveViewStateDto } from './dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('view-state')
@UseGuards(JwtAuthGuard)
export class ViewStateController {
  constructor(private viewStateService: ViewStateService) {}

  @Get(':projectId')
  async getViewState(@Request() req, @Param('projectId') projectId: string) {
    const userId = req.user.userId
    return this.viewStateService.getViewState(userId, projectId)
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async saveViewState(@Request() req, @Body() dto: SaveViewStateDto) {
    const userId = req.user.userId
    return this.viewStateService.saveViewState(userId, dto)
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteViewState(@Request() req, @Param('projectId') projectId: string) {
    const userId = req.user.userId
    await this.viewStateService.deleteViewState(userId, projectId)
  }
}
