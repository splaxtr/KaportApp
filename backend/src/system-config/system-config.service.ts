import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SystemConfigPayload = {
  corsOrigins?: string;
  helmetCsp?: boolean;
  uploadLimitMb?: number;
  rateLimit?: number;
};

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  private async setValue(key: string, value: string) {
    await this.prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async update(payload: SystemConfigPayload) {
    const entries = Object.entries(payload).filter(([, v]) => v !== undefined && v !== null);
    for (const [key, val] of entries) {
      await this.setValue(key, String(val));
    }
    return this.get();
  }

  async get() {
    const rows = await this.prisma.systemConfig.findMany();
    let map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    // Initialize defaults if empty
    if (rows.length === 0) {
      const defaults: SystemConfigPayload = {
        corsOrigins: '',
        helmetCsp: true,
        uploadLimitMb: 150,
        rateLimit: 500,
      };
      await this.update(defaults);
      map = {
        corsOrigins: String(defaults.corsOrigins ?? ''),
        helmetCsp: String(defaults.helmetCsp ?? ''),
        uploadLimitMb: String(defaults.uploadLimitMb ?? ''),
        rateLimit: String(defaults.rateLimit ?? ''),
      };
    }

    return {
      corsOrigins: map.corsOrigins || '',
      helmetCsp: map.helmetCsp === 'true',
      uploadLimitMb: map.uploadLimitMb ? Number(map.uploadLimitMb) : 150,
      rateLimit: map.rateLimit ? Number(map.rateLimit) : 500,
    };
  }
}
