import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { ReviewerModule } from './reviewer/reviewer.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        } : undefined,
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 5,
    }]),
    ReviewerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
