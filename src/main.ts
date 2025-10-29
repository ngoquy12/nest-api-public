import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { Request, Response } from 'express';
import { SeederRunner } from './seeds/seeder-runner';

async function bootstrap() {
  const PORT = process.env.APP_PORT || 3000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const seeder = app.get(SeederRunner);
  await seeder.runAllSeeders();

  app.enableCors({
    origin: '*',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
      'X-Session-Id',
      'Idempotency-Key',
    ],
    exposedHeaders: ['authorization'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('RESTful API Documentation')
    .setDescription(
      `# Tài liệu API miễn phí cho cộng đồng

## 📚 Giới thiệu

Bộ tài liệu API này được xây dựng nhằm mục đích phục vụ cộng đồng học tập và phát triển kỹ năng lập trình. Hệ thống cung cấp một ví dụ thực tế về cách xây dựng ứng dụng Full-Stack hoàn chỉnh, từ backend đến frontend, áp dụng các best practices và design patterns hiện đại.

## 🎯 Mục tiêu

- **Học tập và Phát triển**: Cung cấp nguồn tài liệu tham khảo chi tiết cho các developers muốn học hỏi và nâng cao kỹ năng
- **Best Practices**: Áp dụng các phương pháp tốt nhất trong việc thiết kế API, xử lý lỗi, validation, và bảo mật
- **Cấu trúc Rõ ràng**: Tổ chức code theo mô hình modular, dễ đọc, dễ hiểu và dễ mở rộng
- **Tài liệu Đầy đủ**: Mỗi endpoint được mô tả chi tiết về mục đích, tham số, response và các trường hợp lỗi có thể xảy ra

## 🏗️ Kiến trúc và Công nghệ

- **Backend Framework**: NestJS (Node.js/TypeScript)
- **Database**: MySQL với TypeORM
- **Authentication**: JWT Bearer Token
- **API Documentation**: Swagger/OpenAPI 3.0
- **Validation**: Class-validator và class-transformer
- **Error Handling**: Custom exception filters và standardized response format

## 📖 Cách sử dụng

1. **Xác thực**: Sử dụng JWT Bearer Token để truy cập các protected endpoints
2. **API Versioning**: Tất cả endpoints sử dụng versioning qua URI path (v1, v2...)
3. **Response Format**: Mọi response đều tuân theo chuẩn BaseResponse với statusCode, message và data
4. **Error Handling**: Lỗi được trả về với mã HTTP status code phù hợp và thông báo rõ ràng

## 🔍 Các Module Chính

- **Authentication**: Đăng ký, đăng nhập, quản lý token
- **Users**: Quản lý thông tin người dùng
- **Contacts**: CRUD operations cho danh bạ liên hệ
- **Categories**: Quản lý danh mục
- **Products**: Quản lý sản phẩm
- **Articles**: Quản lý bài viết
- **Comments**: Hệ thống bình luận
- **Notifications**: Thông báo người dùng

## 💡 Lưu ý

Tài liệu này được thiết kế để hỗ trợ quá trình học tập và nghiên cứu. Mỗi endpoint đều có ví dụ request/response cụ thể giúp người dùng dễ dàng hiểu và tích hợp.

**Phiên bản API**: 1.0.0`,
    )
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      in: 'header',
    })
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Ngăn cache nội dung Swagger JSON
  app.use(
    '/api-json',
    (req: Request, res: Response, next: () => void): void => {
      res.setHeader('Cache-Control', 'no-store');
      next();
    },
  );

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // loại bỏ field thừa
      forbidNonWhitelisted: false, // không báo lỗi nếu có field thừa
      skipMissingProperties: true, // cho phép thiếu field trong update
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false, // trả về tất cả lỗi để FE xử lý tốt hơn
    }),
  );

  await app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger running on http://localhost:${PORT}/api/v1/docs`);
  });
}

bootstrap();
