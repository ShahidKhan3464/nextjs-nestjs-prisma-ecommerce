import { LoginResponseDto } from 'src/auth/dto/login-response.dto';
import { RegisterResponseDto } from 'src/auth/dto/register-response.dto';
import { AuthenticatedUserDto } from 'src/auth/dto/authenticated-user.dto';
import { RefreshTokenResponseDto } from 'src/auth/dto/refresh-token-response.dto';
import { AuthenticatedUserWithTokensDto } from 'src/auth/dto/authenticated-user-with-tokens.dto';
import {
  UserResponseDto,
  UserMeResponseDto,
} from 'src/users/dto/user-response.dto';
import {
  SellerProfileResponseDto,
  SellerDocumentResponseDto,
  SellerStoreSummaryResponseDto,
  SellerDocumentFileResponseDto,
} from 'src/seller/dto/seller-profile-response.dto';
import {
  StoredFileResponseDto,
  DeleteFileResponseDto,
  FileAssociationResponseDto,
} from 'src/files/dto/stored-file-response.dto';

export const SWAGGER_EXTRA_MODELS = [
  UserResponseDto,
  LoginResponseDto,
  UserMeResponseDto,
  RegisterResponseDto,
  AuthenticatedUserDto,
  StoredFileResponseDto,
  DeleteFileResponseDto,
  RefreshTokenResponseDto,
  SellerProfileResponseDto,
  SellerDocumentResponseDto,
  FileAssociationResponseDto,
  SellerStoreSummaryResponseDto,
  SellerDocumentFileResponseDto,
  AuthenticatedUserWithTokensDto,
] as const;
