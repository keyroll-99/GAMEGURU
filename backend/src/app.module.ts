import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AuthModule } from './auth';
import { UsersModule } from './users';
import { ProjectsModule } from './projects';
import { NotesModule } from './projects/notes';
import { NodesModule } from './nodes';
import { StoryModule } from './story';
import { ViewStateModule } from './view-state';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    NotesModule,
    NodesModule,
    StoryModule,
    ViewStateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
