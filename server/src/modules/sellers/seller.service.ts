import { Injectable } from '@nestjs/common';
import { SellerDocumentType } from './constants/seller.constants';
import { SellerProfileMapped } from './utils/map-seller-profile.util';
import { QuerySellerProfilesDto } from './dto/query-seller-profiles.dto';
import { CreateSellerProfileDto } from './dto/create-seller-profile.dto';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';
import { RejectSellerProfileDto } from './dto/reject-seller-profile.dto';
import { ApproveSellerProfileDto } from './dto/approve-seller-profile.dto';
import { SuspendSellerProfileDto } from './dto/suspend-seller-profile.dto';
import { GetSellerProfilesProvider } from './providers/get-seller-profiles.provider';
import { CreateSellerProfileProvider } from './providers/create-seller-profile.provider';
import { UpdateSellerProfileProvider } from './providers/update-seller-profile.provider';
import { RejectSellerProfileProvider } from './providers/reject-seller-profile.provider';
import { ApproveSellerProfileProvider } from './providers/approve-seller-profile.provider';
import { SuspendSellerProfileProvider } from './providers/suspend-seller-profile.provider';
import { UploadSellerDocumentProvider } from './providers/upload-seller-document.provider';
import { PaginateQueryResult } from 'src/common/pagination/interfaces/paginated.interfaces';

@Injectable()
export class SellerService {
  constructor(
    private readonly getSellerProfilesProvider: GetSellerProfilesProvider,
    private readonly createSellerProfileProvider: CreateSellerProfileProvider,
    private readonly updateSellerProfileProvider: UpdateSellerProfileProvider,
    private readonly rejectSellerProfileProvider: RejectSellerProfileProvider,
    private readonly approveSellerProfileProvider: ApproveSellerProfileProvider,
    private readonly suspendSellerProfileProvider: SuspendSellerProfileProvider,
    private readonly uploadSellerDocumentProvider: UploadSellerDocumentProvider,
  ) {}

  public createProfile(
    userId: number,
    dto: CreateSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    return this.createSellerProfileProvider.create(userId, dto);
  }

  public getMyProfile(userId: number): Promise<SellerProfileMapped> {
    return this.getSellerProfilesProvider.findMe(userId);
  }

  public getProfileById(id: number): Promise<SellerProfileMapped> {
    return this.getSellerProfilesProvider.findById(id);
  }

  public listProfiles(
    query: QuerySellerProfilesDto,
  ): Promise<PaginateQueryResult<SellerProfileMapped>> {
    return this.getSellerProfilesProvider.findAllPaginated(query);
  }

  public updateMyProfile(
    userId: number,
    dto: UpdateSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    return this.updateSellerProfileProvider.updateMe(userId, dto);
  }

  public approveProfile(
    id: number,
    dto: ApproveSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    return this.approveSellerProfileProvider.approve(id, dto);
  }

  public rejectProfile(
    id: number,
    dto: RejectSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    return this.rejectSellerProfileProvider.reject(id, dto);
  }

  public suspendProfile(
    id: number,
    dto: SuspendSellerProfileDto,
  ): Promise<SellerProfileMapped> {
    return this.suspendSellerProfileProvider.suspend(id, dto);
  }

  public uploadDocument(
    userId: number,
    type: SellerDocumentType,
    file: Express.Multer.File,
  ): Promise<SellerProfileMapped> {
    return this.uploadSellerDocumentProvider.upload(userId, type, file);
  }
}
