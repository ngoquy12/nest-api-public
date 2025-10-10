import { Routes } from '@nestjs/core';
import { AccountsModule } from 'src/modules/accounts/accounts.module';
import { AuthsModule } from 'src/modules/auths/auths.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { ChangeLogsModule } from 'src/modules/change-logs/change-logs.module';
import { EmployeesModule } from 'src/modules/employees/employees.module';
import { PositionsModule } from 'src/modules/positions/positions.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';

export const routes: Routes = [
  {
    path: 'auths',
    module: AuthsModule,
  },
  {
    path: 'users',
    module: UsersModule,
  },

  {
    path: 'categories',
    module: CategoriesModule,
  },
  {
    path: 'employees',
    module: EmployeesModule,
  },
  {
    path: 'positions',
    module: PositionsModule,
  },
  {
    path: 'change-logs',
    module: ChangeLogsModule,
  },

  {
    path: 'products',
    module: ProductsModule,
  },

  {
    path: 'accounts',
    module: AccountsModule,
  },
];
