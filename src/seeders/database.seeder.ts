import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class DatabaseSeeder {
  constructor() {}

  async seed(clearPermissions: boolean = false): Promise<void> {}

  private async assignPermissionsToRoles(): Promise<void> {}
}
