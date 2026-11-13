import { Global, Module } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { StorageService } from './storage.interface';

@Global()
@Module({
  providers: [
    {
      provide: StorageService,
      useClass: LocalStorageService,
    },
    LocalStorageService,
  ],
  exports: [StorageService, LocalStorageService],
})
export class StorageModule {}

