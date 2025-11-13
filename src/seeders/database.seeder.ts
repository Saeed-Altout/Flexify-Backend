import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseSeeder {
  constructor() {}

  async seed(): Promise<void> {}

  private async seedRoles(): Promise<void> {}

  private async seedPermissions(): Promise<void> {}

  private async seedAdminUser(): Promise<void> {}
}
