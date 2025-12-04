import { HttpService } from '@nestjs/axios';
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ActivitiesService } from '../activities/activities.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomBrandDto } from './dto/create-custom-brand.dto';
import { CreateCustomModelDto } from './dto/create-custom-model.dto';
import { CreateCustomYearDto } from './dto/create-custom-year.dto';

@Injectable()
export class CatalogService {
  private readonly baseUrl = 'https://vpic.nhtsa.dot.gov/api/vehicles';

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly activities: ActivitiesService,
  ) {}

  // ---------- Sync from NHTSA ----------
  async syncBrands(actorId: string) {
    const url = `${this.baseUrl}/getallmakes?format=json`;
    const res = await firstValueFrom(this.http.get(url));
    const items = res.data?.Results ?? [];

    for (const item of items) {
      const name = (item?.Make_Name as string | undefined)?.trim();
      if (!name) continue;
      await this.prisma.vehicleBrand.upsert({
        where: { name },
        update: { isCustom: false, shopId: null },
        create: { name, isCustom: false, shopId: null },
      });
    }

    await this.activities.log(actorId, null, 'Catalog synced: brands', 'catalog-sync', 'catalog');
    return { synced: items.length };
  }

  async syncModels(actorId: string) {
    const brands = await this.prisma.vehicleBrand.findMany({ where: { isCustom: false } });
    let totalModels = 0;
    const failed: string[] = [];

    for (const brand of brands) {
      const url = `${this.baseUrl}/getmodelsformake/${encodeURIComponent(brand.name)}?format=json`;
      try {
        const res = await firstValueFrom(this.http.get(url));
        const models = res.data?.Results ?? [];
        for (const m of models) {
          const name = (m?.Model_Name as string | undefined)?.trim();
          if (!name) continue;
          await this.prisma.vehicleModel.upsert({
            where: { name_brandId: { name, brandId: brand.id } },
            update: { isCustom: false, shopId: null },
            create: { name, brandId: brand.id, isCustom: false, shopId: null },
          });
          totalModels++;
        }
      } catch {
        // Skip brands that return 404/invalid responses, keep syncing others
        failed.push(brand.name);
      }
    }

    await this.activities.log(actorId, null, 'Catalog synced: models', 'catalog-sync', 'catalog');
    return { syncedBrands: brands.length, syncedModels: totalModels, failedBrands: failed };
  }

  // ---------- Custom create ----------
  async addCustomBrand(dto: CreateCustomBrandDto, actorId: string) {
    await this.ensureUniqueBrand(dto.name, dto.shopId);
    const brand = await this.prisma.vehicleBrand.create({
      data: {
        name: dto.name.trim(),
        isCustom: true,
        shopId: dto.shopId,
      },
    });
    await this.activities.log(actorId, dto.shopId, `Custom brand added: ${brand.name}`, brand.id, 'catalog');
    return brand;
  }

  async addCustomModel(dto: CreateCustomModelDto, actorId: string) {
    const brand = await this.prisma.vehicleBrand.findUnique({ where: { id: dto.brandId } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    if (brand.isCustom && brand.shopId !== dto.shopId) {
      throw new ForbiddenException('Cannot add model to another shop brand');
    }

    await this.ensureUniqueModel(dto.name, dto.brandId, dto.shopId);

    const model = await this.prisma.vehicleModel.create({
      data: {
        name: dto.name.trim(),
        brandId: dto.brandId,
        isCustom: true,
        shopId: dto.shopId,
      },
    });
    await this.activities.log(actorId, dto.shopId, `Custom model added: ${model.name}`, model.id, 'catalog');
    return model;
  }

  async addCustomYear(dto: CreateCustomYearDto, actorId: string) {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id: dto.modelId },
      include: { brand: true },
    });
    if (!model) {
      throw new NotFoundException('Model not found');
    }
    if (model.isCustom && model.shopId !== dto.shopId) {
      throw new ForbiddenException('Cannot add year to another shop model');
    }
    await this.ensureUniqueYear(dto.year, dto.modelId, dto.shopId);

    const year = await this.prisma.vehicleYear.create({
      data: {
        year: dto.year,
        modelId: dto.modelId,
        isCustom: true,
        shopId: dto.shopId,
      },
    });
    await this.activities.log(actorId, dto.shopId, `Custom year added: ${dto.year}`, year.id, 'catalog');
    return year;
  }

  // ---------- Dropdown feeds ----------
  async listBrands(shopId?: string) {
    const systemBrands = await this.prisma.vehicleBrand.findMany({
      where: { isCustom: false },
      orderBy: { name: 'asc' },
    });
    const customBrands = shopId
      ? await this.prisma.vehicleBrand.findMany({
          where: { isCustom: true, shopId },
          orderBy: { name: 'asc' },
        })
      : [];
    return [...customBrands, ...systemBrands].sort((a, b) => a.name.localeCompare(b.name));
  }

  async listModels(brandId: string, shopId?: string) {
    const brand = await this.prisma.vehicleBrand.findUnique({ where: { id: brandId } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    const systemModels = await this.prisma.vehicleModel.findMany({
      where: { brandId, isCustom: false },
      orderBy: { name: 'asc' },
    });
    const customModels =
      shopId || brand.shopId
        ? await this.prisma.vehicleModel.findMany({
            where: { brandId, isCustom: true, shopId: shopId ?? brand.shopId ?? undefined },
            orderBy: { name: 'asc' },
          })
        : [];
    return [...customModels, ...systemModels].sort((a, b) => a.name.localeCompare(b.name));
  }

  async listYears(modelId: string, shopId?: string) {
    const model = await this.prisma.vehicleModel.findUnique({ where: { id: modelId } });
    if (!model) {
      throw new NotFoundException('Model not found');
    }
    const systemYears = await this.prisma.vehicleYear.findMany({
      where: { modelId, isCustom: false },
      orderBy: { year: 'asc' },
    });
    const customYears =
      shopId || model.shopId
        ? await this.prisma.vehicleYear.findMany({
            where: { modelId, isCustom: true, shopId: shopId ?? model.shopId ?? undefined },
            orderBy: { year: 'asc' },
          })
        : [];
    return [...customYears, ...systemYears].sort((a, b) => a.year - b.year);
  }

  // ---------- Validation helpers ----------
  private async ensureUniqueBrand(name: string, shopId: string) {
    const existing = await this.prisma.vehicleBrand.findFirst({
      where: {
        name: name.trim(),
        OR: [{ shopId }, { shopId: null }],
      },
    });
    if (existing) {
      throw new BadRequestException('Brand already exists');
    }
  }

  private async ensureUniqueModel(name: string, brandId: string, shopId: string) {
    const existing = await this.prisma.vehicleModel.findFirst({
      where: {
        name: name.trim(),
        brandId,
        OR: [{ shopId }, { shopId: null }],
      },
    });
    if (existing) {
      throw new BadRequestException('Model already exists for this brand');
    }
  }

  private async ensureUniqueYear(year: number, modelId: string, shopId: string) {
    const existing = await this.prisma.vehicleYear.findFirst({
      where: {
        year,
        modelId,
        OR: [{ shopId }, { shopId: null }],
      },
    });
    if (existing) {
      throw new BadRequestException('Year already exists for this model');
    }
  }
}
