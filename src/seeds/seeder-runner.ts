import { Injectable } from '@nestjs/common';
import { RoleSeederService } from './role.seeder';

@Injectable()
export class SeederRunner {
  constructor(private readonly roleSeeder: RoleSeederService) {}

  async runAllSeeders() {
    console.log('🔁 Running seeders...');
    await this.roleSeeder.seedRoles();
    console.log('✅ All seeders have been executed.');
  }
}
