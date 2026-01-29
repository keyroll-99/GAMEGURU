import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs', () => {
  return {
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    unlinkSync: jest.fn(),
    writeFileSync: jest.fn(),
    promises: {
      unlink: jest.fn(),
      writeFile: jest.fn(),
    },
  };
});

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadAvatar', () => {
    it('should upload avatar successfully using async fs methods', async () => {
      const userId = 'user-123';
      const file = {
        buffer: Buffer.from('test'),
        mimetype: 'image/jpeg',
        size: 1024,
      } as Express.Multer.File;

      const user = {
        id: userId,
        avatar_url: 'uploads/avatars/old-avatar.jpg',
      };

      // Mock DB calls
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(user);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...user,
        avatar_url: `/uploads/avatars/${userId}-${Date.now()}.jpg`,
      });

      // Mock fs calls
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      // Constructor checks this
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.uploadAvatar(userId, file);

      // Verify fs.promises.unlink was called for the old avatar
      // We need to match the path somewhat loosely or exactly if possible
      expect(fs.promises.unlink).toHaveBeenCalled();

      // Verify fs.promises.writeFile was called for the new avatar
      expect(fs.promises.writeFile).toHaveBeenCalled();
    });
  });
});
