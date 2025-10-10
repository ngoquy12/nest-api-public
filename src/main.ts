import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'body-parser';
import { Request, Response } from 'express';
// import { SeederRunner } from './seeds/seeder-runner';

async function bootstrap() {
  const PORT = process.env.APP_PORT || 3000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // const seeder = app.get(SeederRunner);
  // await seeder.runAllSeeders();

  // await app.close();

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
    .setTitle('Document API Ixe Agent')
    .setDescription(
      'Bộ tài liệu cung cấp đầy đủ, chi tiết các API phục vụ cho ứng dụng Ixe Agent',
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
