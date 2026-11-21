import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

const DOCS_PATH = '/api/docs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  if (config.get<boolean>('TRUST_PROXY')) {
    app.set('trust proxy', 1);
  }

  // Helmet: cho phép cross-origin ở Cross-Origin-Resource-Policy để frontend
  // (origin khác) nhúng được ảnh/logo phục vụ từ API.
  const defaultHelmet = helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });
  // Swagger UI cần script/style inline, CSP mặc định của Helmet sẽ làm trang trắng
  const docsHelmet = helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
      },
    },
  });
  app.use((req: Request, res: Response, next: NextFunction) =>
    req.path.startsWith(DOCS_PATH) ? docsHelmet(req, res, next) : defaultHelmet(req, res, next),
  );

  app.enableCors({
    origin: config.getOrThrow<string[]>('CORS_ORIGINS'),
    credentials: true, // để trình duyệt gửi cookie refresh_token
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  app.use(cookieParser());

  // Mọi API nằm dưới /api, riêng /health giữ nguyên
  app.setGlobalPrefix('api', { exclude: ['health'] });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Recruitment Management System API')
    .setDescription('Tài liệu API của hệ thống quản lý tuyển dụng')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.get<number>('PORT', 3000));
}
void bootstrap();
