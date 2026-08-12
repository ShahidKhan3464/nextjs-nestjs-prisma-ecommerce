import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SeedResult } from '../types/seed-result.type.js';
import { UserRole } from 'src/common/enums/user-role.enum';
import { HashingProvider } from 'src/common/crypto/providers/hashing.provider';
import {
  StoreStatus,
  StoreFileType,
} from 'src/modules/stores/constants/store.constants';
import {
  SellerProfileStatus,
  SellerDocumentType,
} from 'src/modules/sellers/constants/seller.constants';
import {
  DEMO_SELLERS,
  picsumImageUrl,
  DEMO_SELLER_PASSWORD,
  DEMO_SEED_STORE_LOGO_MARKER,
  DEMO_SEED_SELLER_EMAIL_MARKER,
  demoStoreLogoStorageKey,
  demoStoreBannerStorageKey,
  demoSellerDocumentStorageKey,
} from '../data/demo-seed.data.js';

@Injectable()
export class SeedSellersProvider {
  private readonly logger = new Logger(SeedSellersProvider.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashingProvider: HashingProvider,
  ) {}

  public async seed(): Promise<SeedResult> {
    const alreadySeeded = await this.prisma.user.findUnique({
      where: { email: DEMO_SEED_SELLER_EMAIL_MARKER },
    });

    if (alreadySeeded) {
      const assetsResult = await this.seedMissingSellerAssets();

      if (assetsResult.created > 0) {
        this.logger.log(
          `Sellers already existed — backfilled ${assetsResult.created} store/seller file associations.`,
        );
        return assetsResult;
      }

      this.logger.log(
        `Sellers seeding skipped — marker user "${DEMO_SEED_SELLER_EMAIL_MARKER}" already exists.`,
      );
      return {
        created: 0,
        skipped: true,
        reason: 'sellers already seeded',
      };
    }

    const passwordHash = await this.hashingProvider.hash(DEMO_SELLER_PASSWORD);

    const createdCount = await this.prisma.$transaction(async (tx) => {
      let count = 0;

      for (const [index, seller] of DEMO_SELLERS.entries()) {
        const number = String(index + 1).padStart(2, '0');
        const logoSeed = `store-logo-${seller.store.slug}`;
        const bannerSeed = `store-banner-${seller.store.slug}`;

        await tx.user.create({
          data: {
            isBlocked: false,
            email: seller.email,
            password: passwordHash,
            fullName: seller.fullName,
            phoneNumber: seller.phoneNumber,
            userRoles: {
              create: [{ role: UserRole.BUYER }, { role: UserRole.SELLER }],
            },
            sellerProfile: {
              create: {
                approvedAt: new Date(),
                taxNumber: seller.taxNumber,
                businessName: seller.businessName,
                businessPhone: seller.businessPhone,
                businessEmail: seller.businessEmail,
                status: SellerProfileStatus.APPROVED,
                registrationNumber: seller.registrationNumber,
                sellerDocuments: {
                  create: [
                    {
                      type: SellerDocumentType.TAX_DOCUMENT,
                      file: {
                        create: {
                          fileSize: 0,
                          extension: 'pdf',
                          mimeType: 'application/pdf',
                          storedName: `tax-${number}.pdf`,
                          originalName: `tax-document-${number}.pdf`,
                          urlPath: `/uploads/sellers/demo-tax-${number}.pdf`,
                          storageKey: demoSellerDocumentStorageKey(
                            number,
                            'tax',
                          ),
                        },
                      },
                    },
                    {
                      type: SellerDocumentType.BUSINESS_LICENSE,
                      file: {
                        create: {
                          fileSize: 0,
                          extension: 'pdf',
                          mimeType: 'application/pdf',
                          storedName: `license-${number}.pdf`,
                          originalName: `business-license-${number}.pdf`,
                          urlPath: `/uploads/sellers/demo-license-${number}.pdf`,
                          storageKey: demoSellerDocumentStorageKey(
                            number,
                            'license',
                          ),
                        },
                      },
                    },
                  ],
                },
                store: {
                  create: {
                    verifiedAt: new Date(),
                    name: seller.store.name,
                    slug: seller.store.slug,
                    city: seller.store.city,
                    status: StoreStatus.ACTIVE,
                    address: seller.store.address,
                    country: seller.store.country,
                    postalCode: seller.store.postalCode,
                    description: seller.store.description,
                    files: {
                      create: [
                        {
                          type: StoreFileType.LOGO,
                          sortOrder: 0,
                          file: {
                            create: {
                              fileSize: 0,
                              extension: 'jpg',
                              mimeType: 'image/jpeg',
                              storedName: `${logoSeed}.jpg`,
                              originalName: `${logoSeed}.jpg`,
                              urlPath: picsumImageUrl(logoSeed),
                              storageKey: demoStoreLogoStorageKey(
                                seller.store.slug,
                              ),
                            },
                          },
                        },
                        {
                          type: StoreFileType.BANNER,
                          sortOrder: 1,
                          file: {
                            create: {
                              fileSize: 0,
                              extension: 'jpg',
                              mimeType: 'image/jpeg',
                              storedName: `${bannerSeed}.jpg`,
                              originalName: `${bannerSeed}.jpg`,
                              urlPath: picsumImageUrl(bannerSeed),
                              storageKey: demoStoreBannerStorageKey(
                                seller.store.slug,
                              ),
                            },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        });

        count += 1;
      }

      return count;
    });

    this.logger.log(
      `Seeded ${createdCount} sellers with approved profiles, stores, store files, and seller documents (password: ${DEMO_SELLER_PASSWORD}).`,
    );

    return {
      created: createdCount,
      skipped: false,
    };
  }

  /**
   * When sellers already exist from an earlier seed, attach missing
   * StoreFile / SellerDocument rows without recreating users.
   */
  private async seedMissingSellerAssets(): Promise<SeedResult> {
    const logoMarker = await this.prisma.storedFile.findUnique({
      where: { storageKey: DEMO_SEED_STORE_LOGO_MARKER },
    });

    if (logoMarker) {
      return {
        created: 0,
        skipped: true,
        reason: 'seller assets already seeded',
      };
    }

    const profiles = await this.prisma.sellerProfile.findMany({
      where: {
        businessEmail: {
          in: DEMO_SELLERS.map((seller) => seller.businessEmail),
        },
        deletedAt: null,
      },
      select: {
        id: true,
        businessEmail: true,
        store: { select: { id: true, slug: true } },
      },
    });

    if (profiles.length === 0) {
      return {
        created: 0,
        skipped: true,
        reason: 'demo seller profiles missing',
      };
    }

    const createdAssociations = await this.prisma.$transaction(async (tx) => {
      let count = 0;

      for (const [index, seller] of DEMO_SELLERS.entries()) {
        const profile = profiles.find(
          (entry) => entry.businessEmail === seller.businessEmail,
        );

        if (!profile?.store) {
          continue;
        }

        const number = String(index + 1).padStart(2, '0');
        const logoSeed = `store-logo-${seller.store.slug}`;
        const bannerSeed = `store-banner-${seller.store.slug}`;

        const existingLogo = await tx.storeFile.findFirst({
          where: {
            storeId: profile.store.id,
            type: StoreFileType.LOGO,
          },
        });

        if (!existingLogo) {
          const logoFile = await tx.storedFile.create({
            data: {
              fileSize: 0,
              extension: 'jpg',
              mimeType: 'image/jpeg',
              storedName: `${logoSeed}.jpg`,
              originalName: `${logoSeed}.jpg`,
              urlPath: picsumImageUrl(logoSeed),
              storageKey: demoStoreLogoStorageKey(seller.store.slug),
            },
          });

          await tx.storeFile.create({
            data: {
              type: StoreFileType.LOGO,
              sortOrder: 0,
              storeId: profile.store.id,
              fileId: logoFile.id,
            },
          });
          count += 1;
        }

        const existingBanner = await tx.storeFile.findFirst({
          where: {
            storeId: profile.store.id,
            type: StoreFileType.BANNER,
          },
        });

        if (!existingBanner) {
          const bannerFile = await tx.storedFile.create({
            data: {
              fileSize: 0,
              extension: 'jpg',
              mimeType: 'image/jpeg',
              storedName: `${bannerSeed}.jpg`,
              originalName: `${bannerSeed}.jpg`,
              urlPath: picsumImageUrl(bannerSeed),
              storageKey: demoStoreBannerStorageKey(seller.store.slug),
            },
          });

          await tx.storeFile.create({
            data: {
              type: StoreFileType.BANNER,
              sortOrder: 1,
              storeId: profile.store.id,
              fileId: bannerFile.id,
            },
          });
          count += 1;
        }

        const existingTax = await tx.sellerDocument.findFirst({
          where: {
            sellerProfileId: profile.id,
            type: SellerDocumentType.TAX_DOCUMENT,
          },
        });

        if (!existingTax) {
          const taxFile = await tx.storedFile.create({
            data: {
              fileSize: 0,
              extension: 'pdf',
              mimeType: 'application/pdf',
              storedName: `tax-${number}.pdf`,
              originalName: `tax-document-${number}.pdf`,
              urlPath: `/uploads/sellers/demo-tax-${number}.pdf`,
              storageKey: demoSellerDocumentStorageKey(number, 'tax'),
            },
          });

          await tx.sellerDocument.create({
            data: {
              type: SellerDocumentType.TAX_DOCUMENT,
              sellerProfileId: profile.id,
              fileId: taxFile.id,
            },
          });
          count += 1;
        }

        const existingLicense = await tx.sellerDocument.findFirst({
          where: {
            sellerProfileId: profile.id,
            type: SellerDocumentType.BUSINESS_LICENSE,
          },
        });

        if (!existingLicense) {
          const licenseFile = await tx.storedFile.create({
            data: {
              fileSize: 0,
              extension: 'pdf',
              mimeType: 'application/pdf',
              storedName: `license-${number}.pdf`,
              originalName: `business-license-${number}.pdf`,
              urlPath: `/uploads/sellers/demo-license-${number}.pdf`,
              storageKey: demoSellerDocumentStorageKey(number, 'license'),
            },
          });

          await tx.sellerDocument.create({
            data: {
              type: SellerDocumentType.BUSINESS_LICENSE,
              sellerProfileId: profile.id,
              fileId: licenseFile.id,
            },
          });
          count += 1;
        }
      }

      return count;
    });

    return {
      created: createdAssociations,
      skipped: createdAssociations === 0,
      reason:
        createdAssociations === 0 ? 'seller assets already present' : undefined,
    };
  }
}
