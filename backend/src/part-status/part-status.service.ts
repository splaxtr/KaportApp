import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class PartStatusService {
  // PartStatus modeli kaldırıldığı için bu servis artık sadece boş/stub döner.
  async findAll() {
    return [];
  }

  async create() {
    throw new NotFoundException('PartStatus model removed');
  }

  async update() {
    throw new NotFoundException('PartStatus model removed');
  }

  async remove() {
    throw new NotFoundException('PartStatus model removed');
  }
}
