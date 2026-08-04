import { Module } from '@nestjs/common';
import { SellerService } from './seller.service';
import { NotificationModule } from 'src/modules/notifications/notification.module';
import { GetSellerProfilesProvider } from './providers/get-seller-profiles.provider';
import { CreateSellerProfileProvider } from './providers/create-seller-profile.provider';
import { UpdateSellerProfileProvider } from './providers/update-seller-profile.provider';
import { RejectSellerProfileProvider } from './providers/reject-seller-profile.provider';
import { ApproveSellerProfileProvider } from './providers/approve-seller-profile.provider';
import { SuspendSellerProfileProvider } from './providers/suspend-seller-profile.provider';
import { UploadSellerDocumentProvider } from './providers/upload-seller-document.provider';
import {
  SellerController,
  SellerProfilesController,
} from './seller.controller';
@Module({
  imports: [NotificationModule],
  controllers: [SellerController, SellerProfilesController],
  providers: [
    SellerService,
    GetSellerProfilesProvider,
    CreateSellerProfileProvider,
    UpdateSellerProfileProvider,
    RejectSellerProfileProvider,
    ApproveSellerProfileProvider,
    SuspendSellerProfileProvider,
    UploadSellerDocumentProvider,
  ],
  exports: [SellerService],
})
export class SellerModule {}
