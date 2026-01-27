import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, username, password } = registerDto;

    // Sprawdzenie unikalności email i username
    await this.checkEmailUniqueness(email);
    await this.checkUsernameUniqueness(username);

    // Hashowanie hasła
    const passwordHash = await this.hashPassword(password);

    // Tworzenie użytkownika
    try {
      const user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username,
          password_hash: passwordHash,
        },
        select: {
          id: true,
          email: true,
          username: true,
          avatar_url: true,
          created_at: true,
        },
      });

      return {
        message: 'Rejestracja zakończona sukcesem',
        user,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Wystąpił błąd podczas tworzenia konta',
      );
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Znajdź użytkownika
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    // Weryfikacja hasła
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Nieprawidłowy email lub hasło');
    }

    // Generowanie tokenów
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      message: 'Logowanie zakończone sukcesem',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
      },
      ...tokens,
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    try {
      // Weryfikacja refresh tokena
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshToken,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );

      // Sprawdzenie czy to refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Nieprawidłowy refresh token');
      }

      // Sprawdzenie czy użytkownik istnieje
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('Użytkownik nie istnieje');
      }

      // Generowanie nowych tokenów
      const tokens = await this.generateTokens(user.id, user.email);

      return {
        message: 'Token odświeżony',
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Nieprawidłowy lub wygasły refresh token',
      );
    }
  }

  private async generateTokens(userId: string, email: string) {
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'access',
    };

    const refreshPayload: JwtPayload = {
      sub: userId,
      email,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        expiresIn: this.ACCESS_TOKEN_EXPIRY,
      }),
      this.jwtService.signAsync(refreshPayload, {
        expiresIn: this.REFRESH_TOKEN_EXPIRY,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private async checkEmailUniqueness(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException(
        'Użytkownik z tym adresem email już istnieje',
      );
    }
  }

  private async checkUsernameUniqueness(username: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new ConflictException('Użytkownik z tą nazwą już istnieje');
    }
  }
}
