import { LoginResponseDto } from 'src/modules/auth/dto/login-response.dto';
import { RegisterResponseDto } from 'src/modules/auth/dto/register-response.dto';
import { AuthenticatedUserDto } from 'src/modules/auth/dto/authenticated-user.dto';
import { CartItemResponseDto } from 'src/modules/carts/dto/cart-item-response.dto';
import { RefreshTokenResponseDto } from 'src/modules/auth/dto/refresh-token-response.dto';
import { AuthenticatedUserWithTokensDto } from 'src/modules/auth/dto/authenticated-user-with-tokens.dto';
import {
  UserResponseDto,
  UserMeResponseDto,
} from 'src/modules/users/dto/user-response.dto';
import {
  UserDetailResponseDto,
  PaginatedUserResponseDto,
} from 'src/modules/users/dto/user-detail-response.dto';
import {
  SellerProfileResponseDto,
  SellerDocumentResponseDto,
  SellerStoreSummaryResponseDto,
  SellerDocumentFileResponseDto,
} from 'src/modules/sellers/dto/seller-profile-response.dto';
import {
  StoredFileResponseDto,
  DeleteFileResponseDto,
  FileAssociationResponseDto,
} from 'src/modules/files/dto/stored-file-response.dto';
import {
  ProductResponseDto,
  ProductStoreSummaryDto,
  ProductImageResponseDto,
  ProductCategorySummaryDto,
  ProductVariantEmbeddedDto,
  PaginatedProductResponseDto,
} from 'src/modules/products/dto/product-response.dto';
import {
  ProductVariantResponseDto,
  ProductVariantStoreSummaryDto,
  ProductVariantProductSummaryDto,
  PaginatedProductVariantResponseDto,
} from 'src/modules/product-variants/dto/product-variant-response.dto';
import {
  OrderAddressDto,
  OrderResponseDto,
  CheckoutPreviewDto,
  OrderStoreResponseDto,
  OrderBuyerResponseDto,
  OrderLineItemResponseDto,
  PaginatedOrderResponseDto,
  CheckoutSessionResponseDto,
  CompleteCheckoutResponseDto,
} from 'src/modules/orders/dto/order-response.dto';
import {
  CategoryResponseDto,
  PaginatedCategoryResponseDto,
} from 'src/modules/categories/dto/category-response.dto';
import {
  AdminDashboardTotalsDto,
  DashboardStatusCountDto,
  DashboardRevenuePointDto,
  DashboardLowStockItemDto,
  AdminDashboardResponseDto,
  DashboardSpendingPointDto,
  CustomerDashboardResponseDto,
} from 'src/modules/dashboard/dto/dashboard-response.dto';

export const SWAGGER_EXTRA_MODELS = [
  UserResponseDto,
  OrderAddressDto,
  LoginResponseDto,
  OrderResponseDto,
  UserMeResponseDto,
  CheckoutPreviewDto,
  ProductResponseDto,
  RegisterResponseDto,
  CartItemResponseDto,
  CategoryResponseDto,
  AuthenticatedUserDto,
  OrderStoreResponseDto,
  UserDetailResponseDto,
  DeleteFileResponseDto,
  OrderBuyerResponseDto,
  StoredFileResponseDto,
  ProductStoreSummaryDto,
  AdminDashboardTotalsDto,
  ProductImageResponseDto,
  RefreshTokenResponseDto,
  DashboardStatusCountDto,
  DashboardLowStockItemDto,
  OrderLineItemResponseDto,
  PaginatedUserResponseDto,
  SellerProfileResponseDto,
  DashboardRevenuePointDto,
  DashboardSpendingPointDto,
  ProductCategorySummaryDto,
  ProductVariantEmbeddedDto,
  PaginatedOrderResponseDto,
  ProductVariantResponseDto,
  SellerDocumentResponseDto,
  AdminDashboardResponseDto,
  CheckoutSessionResponseDto,
  FileAssociationResponseDto,
  CompleteCheckoutResponseDto,
  PaginatedProductResponseDto,
  PaginatedCategoryResponseDto,
  CustomerDashboardResponseDto,
  SellerStoreSummaryResponseDto,
  ProductVariantStoreSummaryDto,
  SellerDocumentFileResponseDto,
  AuthenticatedUserWithTokensDto,
  ProductVariantProductSummaryDto,
  PaginatedProductVariantResponseDto,
] as const;
