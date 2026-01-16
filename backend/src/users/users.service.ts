import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UpdateProfileDto } from './dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  private readonly UPLOADS_DIR = 'uploads/avatars';

  constructor(private readonly prisma: PrismaService) {
    // Upewnij się, że folder na avatary istnieje
    this.ensureUploadsDirExists();
  }

  private ensureUploadsDirExists() {
    const dir = path.join(process.cwd(), this.UPLOADS_DIR);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const { username } = updateProfileDto;

    // Sprawdź czy nowy username nie jest zajęty
    if (username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Użytkownik z tą nazwą już istnieje');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(username && { username }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      message: 'Profil zaktualizowany',
      user: updatedUser,
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Plik jest wymagany');
    }

    // Walidacja typu pliku
    const allowedMimeTypes = ['image/jpeg', 'image/png'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Dozwolone są tylko pliki JPG i PNG');
    }

    // Walidacja rozmiaru (max 1MB)
    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      throw new BadRequestException('Maksymalny rozmiar pliku to 1MB');
    }

    // Generuj unikalną nazwę pliku
    const extension = file.mimetype === 'image/jpeg' ? 'jpg' : 'png';
    const filename = `${userId}-${Date.now()}.${extension}`;
    const filePath = path.join(process.cwd(), this.UPLOADS_DIR, filename);

    // Usuń stary avatar jeśli istnieje
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar_url: true },
    });

    if (currentUser?.avatar_url) {
      const oldFilePath = path.join(process.cwd(), currentUser.avatar_url);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Zapisz nowy plik
    fs.writeFileSync(filePath, file.buffer);

    // Aktualizuj URL w bazie
    const avatarUrl = `${this.UPLOADS_DIR}/${filename}`;
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar_url: avatarUrl },
      select: {
        id: true,
        email: true,
        username: true,
        avatar_url: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      message: 'Avatar zaktualizowany',
      user: updatedUser,
    };
  }
}
