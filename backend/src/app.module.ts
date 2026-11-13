import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { validateEnv } from './config/env.validation';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
<<<<<<< HEAD
import { StorageModule } from './common/storage/storage.module';
import { UsersModule } from './users/users.module';
<<<<<<< HEAD
import { CandidatesModule } from './candidates/candidates.module';
import { CvsModule } from './cvs/cvs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ApplicationsModule } from './applications/applications.module';
=======
import { UsersModule } from './users/users.module';
>>>>>>> fe2b2426904a9c146ffe57170b05212d678494a5
=======
import { CompaniesModule } from './companies/companies.module';
import { JobsModule } from './jobs/jobs.module';
>>>>>>> 16e6886ca78d8c01c42976428d8d617fe59d81a5
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
<<<<<<< HEAD
    StorageModule,
    NotificationsModule,
    UsersModule,
<<<<<<< HEAD
    CandidatesModule,
    CvsModule,
    ApplicationsModule,
=======
    UsersModule,
>>>>>>> fe2b2426904a9c146ffe57170b05212d678494a5
=======
    CompaniesModule,
    JobsModule,
>>>>>>> 16e6886ca78d8c01c42976428d8d617fe59d81a5
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // bỏ field không khai báo trong DTO
        forbidNonWhitelisted: true, // gửi field lạ thì báo lỗi 400
        transform: true, // tự ép kiểu theo DTO
      }),
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
})
export class AppModule {}
