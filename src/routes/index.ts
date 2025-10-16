import { Routes } from '@nestjs/core';
import { AccountsModule } from 'src/modules/accounts/accounts.module';
import { ArticleCategoriesModule } from 'src/modules/article-categories/article-categories.module';
import { ArticlesModule } from 'src/modules/articles/articles.module';
import { AuthsModule } from 'src/modules/auths/auths.module';
import { CategoriesModule } from 'src/modules/categories/categories.module';
import { CommentsModule } from 'src/modules/comments/comments.module';
import { EmployeesModule } from 'src/modules/employees/employees.module';
import { LikesModule } from 'src/modules/likes/likes.module';
import { PositionsModule } from 'src/modules/positions/positions.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsersModule } from 'src/modules/users/users.module';
import { CartsModule } from 'src/modules/carts/carts.module';

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
    path: 'products',
    module: ProductsModule,
  },
  {
    path: 'carts',
    module: CartsModule,
  },

  {
    path: 'accounts',
    module: AccountsModule,
  },

  // Article Management
  {
    path: 'article-categories',
    module: ArticleCategoriesModule,
  },
  {
    path: 'articles',
    module: ArticlesModule,
  },
  {
    path: 'comments',
    module: CommentsModule,
  },
  {
    path: 'likes',
    module: LikesModule,
  },
];
