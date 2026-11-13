import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class RefreshTokensService {
  readonly ttlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.ttlMs = config.get<number>('REFRESH_TOKEN_TTL_DAYS', 7) * DAY_MS;
  }

  /** Tạo token mới, lưu hash, trả về chuỗi gốc (chỉ lộ một lần duy nhất). */
  async issue(userId: string, familyId: string = randomUUID()): Promise<string> {
    const raw = randomBytes(48).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId,
        familyId,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + this.ttlMs),
      },
    });
    return raw;
  }

  findByRaw(raw: string) {
    return this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(raw) },
      include: { user: true },
    });
  }

  /** Thu hồi nếu còn hiệu lực. Trả true chỉ với MỘT lời gọi thắng cuộc (an toàn khi gọi song song). */
  async revokeIfActive(id: string): Promise<boolean> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count === 1;
  }

  async revokeByRaw(raw: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
