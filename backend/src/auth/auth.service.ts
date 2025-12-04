import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    const hashedPassword = await this.hashData(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name ?? '',
        role: 'null',
      },
    });

    const tokens = await this.getTokens(user.id, user.role, user.shopId);
    await Promise.all([
      this.updateRefreshToken(user.id, tokens.refreshToken),
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      }),
    ]);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.role, user.shopId);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return { user: this.sanitizeUser(user), ...tokens };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
    return { success: true };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshMatches = await bcrypt.compare(
      refreshToken,
      user.hashedRefreshToken,
    );
    if (!refreshMatches) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.getTokens(user.id, user.role, user.shopId);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  private async getTokens(userId: string, role: string, shopId?: string | null) {
    const payload = {
      sub: userId,
      role,
      shopId: shopId ?? undefined,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '14d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefresh = await this.hashData(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: hashedRefresh },
    });
  }

  private async hashData(data: string) {
    return bcrypt.hash(data, 10);
  }

  private sanitizeUser(user: any) {
    const sanitized = { ...user };
    delete sanitized.password;
    delete sanitized.hashedRefreshToken;
    return sanitized;
  }
}
