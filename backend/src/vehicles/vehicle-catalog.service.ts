import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomVehicleEntryDto } from './dto/create-custom-vehicle-entry.dto';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

type CacheEntry<T> = { expiresAt: number; value: T };

@Injectable()
export class VehicleCatalogService {
  private cache = new Map<string, CacheEntry<any>>();

  constructor(private prisma: PrismaService) {}

  private setCache<T>(key: string, value: T) {
    this.cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private async fetchJson<T>(url: string, cacheKey: string): Promise<T> {
    const cached = this.getCache<T>(cacheKey);
    if (cached) return cached;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`NHTSA fetch failed: ${res.status}`);
      const json = (await res.json()) as T;
      this.setCache(cacheKey, json);
      return json;
    } finally {
      clearTimeout(timer);
    }
  }

  private async safeFetchJson<T>(url: string, cacheKey: string): Promise<T | null> {
    try {
      return await this.fetchJson<T>(url, cacheKey);
    } catch {
      return null;
    }
  }

  // 1) Brands
  async getBrands(shopId: string) {
    const data = await this.safeFetchJson<any>(`${NHTSA_BASE}/getallmakes?format=json`, 'nhtsa:brands');
    const nhtsaBrands = (data?.Results || []).map((r: any) => r.Make_Name).filter(Boolean);
    const custom = await this.prisma.customVehicleEntry.findMany({
      where: { shopId },
      select: { brand: true },
      distinct: ['brand'],
    });
    const customBrands = custom.map((c) => c.brand);
    const merged = [...new Set([...customBrands, ...nhtsaBrands])].sort((a, b) => a.localeCompare(b));
    return merged.map((name) => ({ name, isCustom: customBrands.includes(name) }));
  }

  // 2) Models
  async getModels(shopId: string, brand: string) {
    const brandParam = encodeURIComponent(brand);
    const data = await this.safeFetchJson<any>(
      `${NHTSA_BASE}/getmodelsformake/${brandParam}?format=json`,
      `nhtsa:models:${brandParam}`,
    );
    const nhtsaModels = (data?.Results || []).map((r: any) => r.Model_Name).filter(Boolean);
    const custom = await this.prisma.customVehicleEntry.findMany({
      where: { shopId, brand },
      select: { model: true },
      distinct: ['model'],
    });
    const customModels = custom.map((c) => c.model).filter(Boolean) as string[];
    const merged = [...new Set([...customModels, ...nhtsaModels])].sort((a, b) => a.localeCompare(b));
    return merged.map((name) => ({ name, isCustom: customModels.includes(name) }));
  }

  // 3) Years
  async getYears(shopId: string, brand: string, model: string) {
    const brandParam = encodeURIComponent(brand);
    const modelParam = encodeURIComponent(model);
    const data = await this.safeFetchJson<any>(
      `${NHTSA_BASE}/GetVehicleTypesForMakeModel/${brandParam}/${modelParam}?format=json`,
      `nhtsa:years:${brandParam}:${modelParam}`,
    );
    // API doesn't strongly expose year; attempt to read any ModelYear field if present
    const nhtsaYears = (data?.Results || [])
      .map((r: any) => r.ModelYear || r.Year || null)
      .filter((y: any) => typeof y === 'number');

    const custom = await this.prisma.customVehicleEntry.findMany({
      where: { shopId, brand, model },
      select: { year: true },
      distinct: ['year'],
    });
    const customYears = custom.map((c) => c.year).filter((y): y is number => !!y);
    const merged = [...new Set([...customYears, ...nhtsaYears])].sort((a, b) => a - b);
    return merged.map((year) => ({ year, isCustom: customYears.includes(year) }));
  }

  // 4) Packages (from custom entries + existing vehicles)
  async getPackages(shopId: string, brand: string, model: string, year?: number) {
    const custom = await this.prisma.customVehicleEntry.findMany({
      where: { shopId, brand, model, year: year || undefined },
      select: { package: true },
      distinct: ['package'],
    });
    const customPkgs = custom.map((c) => c.package).filter((p): p is string => !!p);

    const vehiclePkgs = await this.prisma.vehicle.findMany({
      where: {
        shopId,
        brand,
        model,
        year: year || undefined,
        package: { not: null },
      },
      select: { package: true },
      distinct: ['package'],
    });
    const vehiclePkgNames = vehiclePkgs.map((v) => v.package!).filter(Boolean);

    const merged = [...new Set([...customPkgs, ...vehiclePkgNames])].sort((a, b) => a.localeCompare(b));
    return merged.map((name) => ({ name }));
  }

  // 4) Create custom entry
  async createCustomEntry(dto: CreateCustomVehicleEntryDto) {
    const payload = {
      shopId: dto.shopId,
      brand: dto.brand.trim(),
      model: dto.model?.trim(),
      year: dto.year,
      package: dto.package?.trim(),
    };
    return this.prisma.customVehicleEntry.create({ data: payload });
  }
}
