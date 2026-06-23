export const DEMO_SEED_CATEGORY_MARKER = 'Electronics & Gadgets';

export const DEMO_SEED_PRODUCT_SKU_MARKER = 'SEED-ELEC-001-BLK';

export const DEMO_SEED_CUSTOMER_EMAIL_MARKER = 'demo.customer1@example.com';

export const DEMO_CUSTOMER_PASSWORD = 'Password@123';

export type DemoCategorySeed = {
  name: string;
  description: string;
};

type DemoVariantSeed = {
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
};

export type DemoProductSeed = {
  categoryName: string;
  name: string;
  description: string;
  imageSeed: string;
  variants: DemoVariantSeed[];
};

export function picsumImageUrl(seed: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;
}

export const DEMO_CATEGORIES: DemoCategorySeed[] = [
  {
    name: 'Electronics & Gadgets',
    description:
      'Smartphones, audio gear, charging accessories, and everyday tech essentials for work and play.',
  },
  {
    name: 'Clothing & Apparel',
    description:
      'Comfortable everyday wear, seasonal layers, and performance fabrics for men and women.',
  },
  {
    name: 'Home & Kitchen',
    description:
      'Cookware, bedding, lighting, and organization products to refresh any living space.',
  },
  {
    name: 'Sports & Outdoors',
    description:
      'Fitness equipment, camping gear, and active lifestyle accessories for indoor and outdoor use.',
  },
  {
    name: 'Beauty & Personal Care',
    description:
      'Skincare, hair care, and grooming products curated for daily self-care routines.',
  },
  {
    name: 'Books & Stationery',
    description:
      'Journals, writing tools, desk accessories, and educational titles for home and office.',
  },
  {
    name: 'Toys & Games',
    description:
      'Creative playsets, family board games, and gifts for kids of all ages.',
  },
  {
    name: 'Health & Wellness',
    description:
      'Supplements, recovery tools, and wellness devices to support a balanced lifestyle.',
  },
  {
    name: 'Automotive',
    description:
      'Interior accessories, cleaning kits, and roadside essentials for everyday drivers.',
  },
  {
    name: 'Jewelry & Accessories',
    description:
      'Timeless jewelry, wallets, sunglasses, and finishing touches for any outfit.',
  },
];

export const DEMO_CUSTOMERS = Array.from({ length: 10 }, (_, index) => {
  const number = String(index + 1).padStart(2, '0');

  return {
    fullName: `Demo Customer ${number}`,
    email: `demo.customer${index + 1}@example.com`,
    phoneNumber: `0300123456${index}`,
  };
});

export const DEMO_PRODUCTS: DemoProductSeed[] = [
  {
    categoryName: 'Electronics & Gadgets',
    name: 'Wireless Bluetooth Earbuds',
    description:
      'Premium wireless earbuds with active noise cancellation, 24-hour battery life, and IPX5 water resistance.',
    imageSeed: 'electronics-wireless-earbuds',
    variants: [
      {
        size: 'One Size',
        color: 'Midnight Black',
        sku: 'SEED-ELEC-001-BLK',
        stock: 45,
        price: 79.99,
      },
      {
        size: 'One Size',
        color: 'Pearl White',
        sku: 'SEED-ELEC-001-WHT',
        stock: 38,
        price: 79.99,
      },
      {
        size: 'One Size',
        color: 'Ocean Blue',
        sku: 'SEED-ELEC-001-BLU',
        stock: 22,
        price: 84.99,
      },
    ],
  },
  {
    categoryName: 'Electronics & Gadgets',
    name: 'Smart Watch Series X',
    description:
      'Fitness tracking smartwatch with heart-rate monitoring, GPS, sleep insights, and a vibrant AMOLED display.',
    imageSeed: 'electronics-smart-watch',
    variants: [
      {
        size: '42mm',
        color: 'Graphite',
        sku: 'SEED-ELEC-002-42-GRA',
        stock: 30,
        price: 249.99,
      },
      {
        size: '46mm',
        color: 'Silver',
        sku: 'SEED-ELEC-002-46-SLV',
        stock: 18,
        price: 269.99,
      },
    ],
  },
  {
    categoryName: 'Electronics & Gadgets',
    name: 'Portable Power Bank 20000mAh',
    description:
      'High-capacity power bank with dual USB-C ports, fast charging support, and airline-safe certification.',
    imageSeed: 'electronics-power-bank',
    variants: [
      {
        size: '20000mAh',
        color: 'Charcoal',
        sku: 'SEED-ELEC-003-20K-CHA',
        stock: 60,
        price: 49.99,
      },
      {
        size: '20000mAh',
        color: 'Navy',
        sku: 'SEED-ELEC-003-20K-NAV',
        stock: 44,
        price: 49.99,
      },
    ],
  },
  {
    categoryName: 'Electronics & Gadgets',
    name: 'USB-C Hub 7-in-1',
    description:
      'Compact aluminum USB-C hub with HDMI, SD card reader, and multiple USB ports for laptops and tablets.',
    imageSeed: 'electronics-usb-hub',
    variants: [
      {
        size: 'Standard',
        color: 'Space Gray',
        sku: 'SEED-ELEC-004-STD-GRY',
        stock: 55,
        price: 39.99,
      },
      {
        size: 'Standard',
        color: 'Silver',
        sku: 'SEED-ELEC-004-STD-SLV',
        stock: 41,
        price: 39.99,
      },
      {
        size: 'Pro',
        color: 'Space Gray',
        sku: 'SEED-ELEC-004-PRO-GRY',
        stock: 27,
        price: 54.99,
      },
    ],
  },
  {
    categoryName: 'Clothing & Apparel',
    name: 'Classic Cotton T-Shirt',
    description:
      'Soft breathable cotton tee with a relaxed fit, reinforced neckline, and fade-resistant colors.',
    imageSeed: 'clothing-cotton-tshirt',
    variants: [
      {
        size: 'S',
        color: 'White',
        sku: 'SEED-CLTH-001-S-WHT',
        stock: 40,
        price: 24.99,
      },
      {
        size: 'M',
        color: 'Navy',
        sku: 'SEED-CLTH-001-M-NAV',
        stock: 52,
        price: 24.99,
      },
      {
        size: 'L',
        color: 'Black',
        sku: 'SEED-CLTH-001-L-BLK',
        stock: 36,
        price: 24.99,
      },
    ],
  },
  {
    categoryName: 'Clothing & Apparel',
    name: 'Slim Fit Denim Jeans',
    description:
      'Stretch denim jeans with a modern slim silhouette, durable stitching, and comfortable all-day wear.',
    imageSeed: 'clothing-denim-jeans',
    variants: [
      {
        size: '30',
        color: 'Indigo',
        sku: 'SEED-CLTH-002-30-IND',
        stock: 28,
        price: 59.99,
      },
      {
        size: '32',
        color: 'Indigo',
        sku: 'SEED-CLTH-002-32-IND',
        stock: 34,
        price: 59.99,
      },
      {
        size: '34',
        color: 'Dark Wash',
        sku: 'SEED-CLTH-002-34-DRK',
        stock: 25,
        price: 64.99,
      },
    ],
  },
  {
    categoryName: 'Clothing & Apparel',
    name: 'Wool Blend Winter Jacket',
    description:
      'Insulated wool-blend jacket with wind-resistant shell, inner pockets, and a tailored urban cut.',
    imageSeed: 'clothing-winter-jacket',
    variants: [
      {
        size: 'M',
        color: 'Camel',
        sku: 'SEED-CLTH-003-M-CAM',
        stock: 15,
        price: 129.99,
      },
      {
        size: 'L',
        color: 'Charcoal',
        sku: 'SEED-CLTH-003-L-CHA',
        stock: 12,
        price: 129.99,
      },
    ],
  },
  {
    categoryName: 'Clothing & Apparel',
    name: 'Running Athletic Shorts',
    description:
      'Lightweight moisture-wicking running shorts with built-in liner, zip pocket, and reflective trim.',
    imageSeed: 'clothing-athletic-shorts',
    variants: [
      {
        size: 'M',
        color: 'Black',
        sku: 'SEED-CLTH-004-M-BLK',
        stock: 48,
        price: 34.99,
      },
      {
        size: 'L',
        color: 'Royal Blue',
        sku: 'SEED-CLTH-004-L-BLU',
        stock: 39,
        price: 34.99,
      },
      {
        size: 'XL',
        color: 'Gray',
        sku: 'SEED-CLTH-004-XL-GRY',
        stock: 31,
        price: 34.99,
      },
    ],
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'Stainless Steel Cookware Set',
    description:
      'Ten-piece stainless steel cookware set with tri-ply construction and oven-safe tempered glass lids.',
    imageSeed: 'home-cookware-set',
    variants: [
      {
        size: '10-Piece',
        color: 'Stainless',
        sku: 'SEED-HOME-001-10-SST',
        stock: 20,
        price: 189.99,
      },
      {
        size: '12-Piece',
        color: 'Stainless',
        sku: 'SEED-HOME-001-12-SST',
        stock: 14,
        price: 219.99,
      },
    ],
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'Memory Foam Pillow',
    description:
      'Cooling gel-infused memory foam pillow with ergonomic neck support and removable washable cover.',
    imageSeed: 'home-memory-foam-pillow',
    variants: [
      {
        size: 'Standard',
        color: 'White',
        sku: 'SEED-HOME-002-STD-WHT',
        stock: 65,
        price: 44.99,
      },
      {
        size: 'King',
        color: 'White',
        sku: 'SEED-HOME-002-KNG-WHT',
        stock: 42,
        price: 54.99,
      },
      {
        size: 'Standard',
        color: 'Gray',
        sku: 'SEED-HOME-002-STD-GRY',
        stock: 38,
        price: 44.99,
      },
    ],
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'LED Desk Lamp',
    description:
      'Adjustable LED desk lamp with touch dimming, USB charging port, and eye-care warm light modes.',
    imageSeed: 'home-led-desk-lamp',
    variants: [
      {
        size: 'Standard',
        color: 'Matte Black',
        sku: 'SEED-HOME-003-STD-BLK',
        stock: 50,
        price: 29.99,
      },
      {
        size: 'Standard',
        color: 'White',
        sku: 'SEED-HOME-003-STD-WHT',
        stock: 47,
        price: 29.99,
      },
    ],
  },
  {
    categoryName: 'Home & Kitchen',
    name: 'Ceramic Dinner Plates Set',
    description:
      'Hand-glazed ceramic dinner plates with chip-resistant finish, microwave safe, and dishwasher friendly.',
    imageSeed: 'home-ceramic-plates',
    variants: [
      {
        size: '4-Piece',
        color: 'Ivory',
        sku: 'SEED-HOME-004-4-IVR',
        stock: 33,
        price: 39.99,
      },
      {
        size: '6-Piece',
        color: 'Ivory',
        sku: 'SEED-HOME-004-6-IVR',
        stock: 26,
        price: 54.99,
      },
      {
        size: '4-Piece',
        color: 'Slate',
        sku: 'SEED-HOME-004-4-SLT',
        stock: 29,
        price: 39.99,
      },
    ],
  },
  {
    categoryName: 'Sports & Outdoors',
    name: 'Yoga Mat Premium',
    description:
      'Non-slip yoga mat with extra cushioning, alignment guides, and a carrying strap for studio or travel.',
    imageSeed: 'sports-yoga-mat',
    variants: [
      {
        size: '6mm',
        color: 'Teal',
        sku: 'SEED-SPOR-001-6-TEA',
        stock: 58,
        price: 32.99,
      },
      {
        size: '8mm',
        color: 'Purple',
        sku: 'SEED-SPOR-001-8-PUR',
        stock: 44,
        price: 36.99,
      },
    ],
  },
  {
    categoryName: 'Sports & Outdoors',
    name: 'Adjustable Dumbbells Set',
    description:
      'Space-saving adjustable dumbbells with quick-lock weight changes from 5 to 25 pounds per hand.',
    imageSeed: 'sports-adjustable-dumbbells',
    variants: [
      {
        size: '25lb Pair',
        color: 'Black',
        sku: 'SEED-SPOR-002-25-BLK',
        stock: 16,
        price: 149.99,
      },
      {
        size: '50lb Pair',
        color: 'Black',
        sku: 'SEED-SPOR-002-50-BLK',
        stock: 10,
        price: 249.99,
      },
      {
        size: '25lb Pair',
        color: 'Red',
        sku: 'SEED-SPOR-002-25-RED',
        stock: 12,
        price: 149.99,
      },
    ],
  },
  {
    categoryName: 'Sports & Outdoors',
    name: 'Camping Tent 4-Person',
    description:
      'Weather-resistant dome tent with easy setup poles, ventilation panels, and a waterproof rainfly.',
    imageSeed: 'sports-camping-tent',
    variants: [
      {
        size: '4-Person',
        color: 'Forest Green',
        sku: 'SEED-SPOR-003-4-GRN',
        stock: 11,
        price: 119.99,
      },
      {
        size: '4-Person',
        color: 'Sand',
        sku: 'SEED-SPOR-003-4-SND',
        stock: 9,
        price: 119.99,
      },
    ],
  },
  {
    categoryName: 'Sports & Outdoors',
    name: 'Cycling Water Bottle',
    description:
      'BPA-free squeeze water bottle with leak-proof cap, bike cage fit, and volume markings for hydration.',
    imageSeed: 'sports-cycling-bottle',
    variants: [
      {
        size: '750ml',
        color: 'Clear Blue',
        sku: 'SEED-SPOR-004-750-BLU',
        stock: 72,
        price: 14.99,
      },
      {
        size: '750ml',
        color: 'Smoke',
        sku: 'SEED-SPOR-004-750-SMK',
        stock: 68,
        price: 14.99,
      },
      {
        size: '1L',
        color: 'Clear Blue',
        sku: 'SEED-SPOR-004-1L-BLU',
        stock: 55,
        price: 16.99,
      },
    ],
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Hydrating Face Moisturizer',
    description:
      'Daily face moisturizer with hyaluronic acid and vitamin E for long-lasting hydration and smooth skin.',
    imageSeed: 'beauty-face-moisturizer',
    variants: [
      {
        size: '50ml',
        color: 'Unscented',
        sku: 'SEED-BEAU-001-50-UNS',
        stock: 80,
        price: 22.99,
      },
      {
        size: '100ml',
        color: 'Unscented',
        sku: 'SEED-BEAU-001-100-UNS',
        stock: 54,
        price: 34.99,
      },
    ],
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Argan Oil Hair Serum',
    description:
      'Lightweight argan oil serum that tames frizz, adds shine, and protects hair from heat styling damage.',
    imageSeed: 'beauty-argan-hair-serum',
    variants: [
      {
        size: '60ml',
        color: 'Original',
        sku: 'SEED-BEAU-002-60-ORG',
        stock: 63,
        price: 18.99,
      },
      {
        size: '100ml',
        color: 'Original',
        sku: 'SEED-BEAU-002-100-ORG',
        stock: 41,
        price: 26.99,
      },
      {
        size: '60ml',
        color: 'Rose',
        sku: 'SEED-BEAU-002-60-ROS',
        stock: 37,
        price: 19.99,
      },
    ],
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Electric Toothbrush',
    description:
      'Rechargeable sonic toothbrush with multiple cleaning modes, two-minute timer, and replacement brush heads.',
    imageSeed: 'beauty-electric-toothbrush',
    variants: [
      {
        size: 'Standard',
        color: 'White',
        sku: 'SEED-BEAU-003-STD-WHT',
        stock: 46,
        price: 59.99,
      },
      {
        size: 'Standard',
        color: 'Pink',
        sku: 'SEED-BEAU-003-STD-PNK',
        stock: 39,
        price: 59.99,
      },
    ],
  },
  {
    categoryName: 'Beauty & Personal Care',
    name: 'Lavender Body Wash',
    description:
      'Plant-based lavender body wash with gentle cleansers and a calming botanical scent for daily use.',
    imageSeed: 'beauty-lavender-body-wash',
    variants: [
      {
        size: '500ml',
        color: 'Lavender',
        sku: 'SEED-BEAU-004-500-LAV',
        stock: 90,
        price: 12.99,
      },
      {
        size: '1L',
        color: 'Lavender',
        sku: 'SEED-BEAU-004-1L-LAV',
        stock: 61,
        price: 18.99,
      },
    ],
  },
  {
    categoryName: 'Books & Stationery',
    name: 'Leather Bound Journal',
    description:
      'Hand-stitched leather journal with acid-free lined pages, ribbon bookmark, and elastic closure band.',
    imageSeed: 'books-leather-journal',
    variants: [
      {
        size: 'A5',
        color: 'Brown',
        sku: 'SEED-BOOK-001-A5-BRN',
        stock: 35,
        price: 27.99,
      },
      {
        size: 'A5',
        color: 'Black',
        sku: 'SEED-BOOK-001-A5-BLK',
        stock: 32,
        price: 27.99,
      },
      {
        size: 'A6',
        color: 'Brown',
        sku: 'SEED-BOOK-001-A6-BRN',
        stock: 28,
        price: 22.99,
      },
    ],
  },
  {
    categoryName: 'Books & Stationery',
    name: 'Gel Pen Set 12-Pack',
    description:
      'Smooth-writing gel pen set with quick-dry ink, comfortable grip, and assorted professional colors.',
    imageSeed: 'books-gel-pen-set',
    variants: [
      {
        size: '12-Pack',
        color: 'Assorted',
        sku: 'SEED-BOOK-002-12-AST',
        stock: 95,
        price: 11.99,
      },
      {
        size: '24-Pack',
        color: 'Assorted',
        sku: 'SEED-BOOK-002-24-AST',
        stock: 58,
        price: 19.99,
      },
    ],
  },
  {
    categoryName: 'Books & Stationery',
    name: 'Programming Fundamentals Book',
    description:
      'Beginner-friendly programming guide covering core concepts, practical exercises, and real-world examples.',
    imageSeed: 'books-programming-fundamentals',
    variants: [
      {
        size: 'Paperback',
        color: 'N/A',
        sku: 'SEED-BOOK-003-PB-NA',
        stock: 40,
        price: 29.99,
      },
      {
        size: 'Hardcover',
        color: 'N/A',
        sku: 'SEED-BOOK-003-HC-NA',
        stock: 22,
        price: 39.99,
      },
    ],
  },
  {
    categoryName: 'Books & Stationery',
    name: 'Desk Organizer Set',
    description:
      'Modular desk organizer set with compartments for pens, notes, and accessories in a minimalist design.',
    imageSeed: 'books-desk-organizer',
    variants: [
      {
        size: '3-Piece',
        color: 'White',
        sku: 'SEED-BOOK-004-3-WHT',
        stock: 43,
        price: 24.99,
      },
      {
        size: '3-Piece',
        color: 'Bamboo',
        sku: 'SEED-BOOK-004-3-BAM',
        stock: 36,
        price: 29.99,
      },
      {
        size: '5-Piece',
        color: 'White',
        sku: 'SEED-BOOK-004-5-WHT',
        stock: 24,
        price: 34.99,
      },
    ],
  },
  {
    categoryName: 'Toys & Games',
    name: 'Building Blocks 500-Piece Set',
    description:
      'Creative building blocks set with assorted shapes and colors to inspire imaginative construction play.',
    imageSeed: 'toys-building-blocks',
    variants: [
      {
        size: '500-Piece',
        color: 'Multicolor',
        sku: 'SEED-TOYS-001-500-MUL',
        stock: 30,
        price: 34.99,
      },
      {
        size: '750-Piece',
        color: 'Multicolor',
        sku: 'SEED-TOYS-001-750-MUL',
        stock: 18,
        price: 44.99,
      },
    ],
  },
  {
    categoryName: 'Toys & Games',
    name: 'Strategy Board Game',
    description:
      'Award-winning strategy board game for 2-4 players with quick setup, replayable scenarios, and rich artwork.',
    imageSeed: 'toys-strategy-board-game',
    variants: [
      {
        size: 'Standard',
        color: 'N/A',
        sku: 'SEED-TOYS-002-STD-NA',
        stock: 27,
        price: 39.99,
      },
      {
        size: 'Deluxe',
        color: 'N/A',
        sku: 'SEED-TOYS-002-DLX-NA',
        stock: 15,
        price: 54.99,
      },
      {
        size: 'Standard',
        color: 'Limited',
        sku: 'SEED-TOYS-002-STD-LTD',
        stock: 10,
        price: 44.99,
      },
    ],
  },
  {
    categoryName: 'Toys & Games',
    name: 'Remote Control Car',
    description:
      'High-speed remote control car with responsive steering, rechargeable battery, and rugged off-road tires.',
    imageSeed: 'toys-remote-control-car',
    variants: [
      {
        size: '1:16',
        color: 'Red',
        sku: 'SEED-TOYS-003-116-RED',
        stock: 24,
        price: 49.99,
      },
      {
        size: '1:16',
        color: 'Blue',
        sku: 'SEED-TOYS-003-116-BLU',
        stock: 21,
        price: 49.99,
      },
    ],
  },
  {
    categoryName: 'Toys & Games',
    name: 'Plush Teddy Bear',
    description:
      'Soft huggable teddy bear made with hypoallergenic filling, embroidered details, and a satin bow.',
    imageSeed: 'toys-plush-teddy-bear',
    variants: [
      {
        size: '12 inch',
        color: 'Brown',
        sku: 'SEED-TOYS-004-12-BRN',
        stock: 52,
        price: 19.99,
      },
      {
        size: '18 inch',
        color: 'Brown',
        sku: 'SEED-TOYS-004-18-BRN',
        stock: 34,
        price: 27.99,
      },
      {
        size: '12 inch',
        color: 'Cream',
        sku: 'SEED-TOYS-004-12-CRM',
        stock: 41,
        price: 19.99,
      },
    ],
  },
  {
    categoryName: 'Health & Wellness',
    name: 'Vitamin D3 Supplements',
    description:
      'High-potency vitamin D3 softgels supporting bone health, immune function, and daily wellness routines.',
    imageSeed: 'health-vitamin-d3',
    variants: [
      {
        size: '60 Count',
        color: 'N/A',
        sku: 'SEED-HLTH-001-60-NA',
        stock: 88,
        price: 14.99,
      },
      {
        size: '120 Count',
        color: 'N/A',
        sku: 'SEED-HLTH-001-120-NA',
        stock: 62,
        price: 24.99,
      },
    ],
  },
  {
    categoryName: 'Health & Wellness',
    name: 'Foam Roller for Recovery',
    description:
      'High-density foam roller for muscle recovery, mobility work, and post-workout tension relief.',
    imageSeed: 'health-foam-roller',
    variants: [
      {
        size: '18 inch',
        color: 'Black',
        sku: 'SEED-HLTH-002-18-BLK',
        stock: 47,
        price: 21.99,
      },
      {
        size: '24 inch',
        color: 'Black',
        sku: 'SEED-HLTH-002-24-BLK',
        stock: 33,
        price: 26.99,
      },
      {
        size: '18 inch',
        color: 'Blue',
        sku: 'SEED-HLTH-002-18-BLU',
        stock: 29,
        price: 21.99,
      },
    ],
  },
  {
    categoryName: 'Health & Wellness',
    name: 'Digital Blood Pressure Monitor',
    description:
      'Clinically validated upper-arm blood pressure monitor with large display and irregular heartbeat detection.',
    imageSeed: 'health-blood-pressure-monitor',
    variants: [
      {
        size: 'Standard',
        color: 'White',
        sku: 'SEED-HLTH-003-STD-WHT',
        stock: 19,
        price: 69.99,
      },
      {
        size: 'Standard',
        color: 'Gray',
        sku: 'SEED-HLTH-003-STD-GRY',
        stock: 14,
        price: 69.99,
      },
    ],
  },
  {
    categoryName: 'Health & Wellness',
    name: 'Essential Oil Diffuser',
    description:
      'Ultrasonic essential oil diffuser with ambient LED lighting, auto shut-off, and quiet operation.',
    imageSeed: 'health-essential-oil-diffuser',
    variants: [
      {
        size: '300ml',
        color: 'Wood Grain',
        sku: 'SEED-HLTH-004-300-WOD',
        stock: 36,
        price: 32.99,
      },
      {
        size: '500ml',
        color: 'Wood Grain',
        sku: 'SEED-HLTH-004-500-WOD',
        stock: 24,
        price: 39.99,
      },
    ],
  },
  {
    categoryName: 'Automotive',
    name: 'Car Phone Mount',
    description:
      'Secure dashboard phone mount with one-hand release, 360-degree rotation, and universal device compatibility.',
    imageSeed: 'automotive-phone-mount',
    variants: [
      {
        size: 'Universal',
        color: 'Black',
        sku: 'SEED-AUTO-001-UNI-BLK',
        stock: 74,
        price: 16.99,
      },
      {
        size: 'Universal',
        color: 'Silver',
        sku: 'SEED-AUTO-001-UNI-SLV',
        stock: 58,
        price: 16.99,
      },
    ],
  },
  {
    categoryName: 'Automotive',
    name: 'Microfiber Cleaning Kit',
    description:
      'Automotive microfiber cleaning kit with plush towels, applicator pads, and interior detailing cloths.',
    imageSeed: 'automotive-cleaning-kit',
    variants: [
      {
        size: '6-Piece',
        color: 'Gray',
        sku: 'SEED-AUTO-002-6-GRY',
        stock: 49,
        price: 19.99,
      },
      {
        size: '10-Piece',
        color: 'Gray',
        sku: 'SEED-AUTO-002-10-GRY',
        stock: 31,
        price: 27.99,
      },
      {
        size: '6-Piece',
        color: 'Blue',
        sku: 'SEED-AUTO-002-6-BLU',
        stock: 27,
        price: 19.99,
      },
    ],
  },
  {
    categoryName: 'Automotive',
    name: 'Emergency Roadside Kit',
    description:
      'Compact roadside emergency kit with jumper cables, reflective vest, flashlight, and basic tools.',
    imageSeed: 'automotive-roadside-kit',
    variants: [
      {
        size: 'Standard',
        color: 'Red',
        sku: 'SEED-AUTO-003-STD-RED',
        stock: 23,
        price: 44.99,
      },
      {
        size: 'Premium',
        color: 'Red',
        sku: 'SEED-AUTO-003-PRM-RED',
        stock: 16,
        price: 64.99,
      },
    ],
  },
  {
    categoryName: 'Automotive',
    name: 'Leather Steering Wheel Cover',
    description:
      'Hand-stitched leather steering wheel cover with improved grip, breathable lining, and easy installation.',
    imageSeed: 'automotive-steering-cover',
    variants: [
      {
        size: '15 inch',
        color: 'Black',
        sku: 'SEED-AUTO-004-15-BLK',
        stock: 42,
        price: 24.99,
      },
      {
        size: '15 inch',
        color: 'Brown',
        sku: 'SEED-AUTO-004-15-BRN',
        stock: 35,
        price: 24.99,
      },
      {
        size: '16 inch',
        color: 'Black',
        sku: 'SEED-AUTO-004-16-BLK',
        stock: 28,
        price: 24.99,
      },
    ],
  },
  {
    categoryName: 'Jewelry & Accessories',
    name: 'Sterling Silver Pendant Necklace',
    description:
      'Elegant sterling silver pendant necklace with a polished finish and adjustable chain length.',
    imageSeed: 'jewelry-silver-pendant',
    variants: [
      {
        size: '16 inch',
        color: 'Silver',
        sku: 'SEED-JEWL-001-16-SLV',
        stock: 20,
        price: 79.99,
      },
      {
        size: '18 inch',
        color: 'Silver',
        sku: 'SEED-JEWL-001-18-SLV',
        stock: 17,
        price: 84.99,
      },
    ],
  },
  {
    categoryName: 'Jewelry & Accessories',
    name: 'Classic Leather Wallet',
    description:
      'Slim bifold leather wallet with RFID blocking, multiple card slots, and a discreet coin pocket.',
    imageSeed: 'jewelry-leather-wallet',
    variants: [
      {
        size: 'Standard',
        color: 'Black',
        sku: 'SEED-JEWL-002-STD-BLK',
        stock: 56,
        price: 34.99,
      },
      {
        size: 'Standard',
        color: 'Cognac',
        sku: 'SEED-JEWL-002-STD-COG',
        stock: 44,
        price: 34.99,
      },
      {
        size: 'Slim',
        color: 'Black',
        sku: 'SEED-JEWL-002-SLM-BLK',
        stock: 38,
        price: 29.99,
      },
    ],
  },
  {
    categoryName: 'Jewelry & Accessories',
    name: 'Polarized Sunglasses',
    description:
      'UV400 polarized sunglasses with lightweight frames, scratch-resistant lenses, and included hard case.',
    imageSeed: 'jewelry-polarized-sunglasses',
    variants: [
      {
        size: 'Standard',
        color: 'Black',
        sku: 'SEED-JEWL-003-STD-BLK',
        stock: 48,
        price: 49.99,
      },
      {
        size: 'Standard',
        color: 'Tortoise',
        sku: 'SEED-JEWL-003-STD-TOR',
        stock: 36,
        price: 49.99,
      },
    ],
  },
  {
    categoryName: 'Jewelry & Accessories',
    name: 'Stainless Steel Watch',
    description:
      'Minimalist stainless steel watch with quartz movement, water resistance, and a versatile link bracelet.',
    imageSeed: 'jewelry-stainless-watch',
    variants: [
      {
        size: '40mm',
        color: 'Silver',
        sku: 'SEED-JEWL-004-40-SLV',
        stock: 18,
        price: 119.99,
      },
      {
        size: '42mm',
        color: 'Silver',
        sku: 'SEED-JEWL-004-42-SLV',
        stock: 14,
        price: 129.99,
      },
      {
        size: '40mm',
        color: 'Gold',
        sku: 'SEED-JEWL-004-40-GLD',
        stock: 11,
        price: 124.99,
      },
    ],
  },
];
