import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { ProjectsModule } from '../projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
