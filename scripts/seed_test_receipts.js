const path = require('path');
require(path.join(__dirname, '../server/node_modules/dotenv')).config({
  path: path.join(__dirname, '../server/.env'),
});
const mongoose = require(path.join(__dirname, '../server/node_modules/mongoose'));

const User = require('../server/models/User.model');
const Receipt = require('../server/models/Receipt.model');
const Product = require('../server/models/Product.model');

async function seed() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/billbox';
  console.log(`Connecting to MongoDB at: ${uri}`);
  await mongoose.connect(uri);

  let user = await User.findOne();
  if (!user) {
    console.log('No user found in database. Creating default demo user...');
    user = await User.create({
      name: 'Demo User',
      email: 'demo@billbox.local',
      password: 'Password123!',
      currency: 'INR',
    });
  }

  console.log(`Using target user: ${user.name} (${user.email}) [${user._id}]`);

  const sampleReceipts = [
    {
      storeName: 'Apple Store BKC',
      invoiceNumber: 'INV-APL-2026-9812',
      purchaseDate: new Date('2026-02-15'),
      category: 'Electronics',
      paymentMethod: 'Credit Card',
      subtotal: 184900,
      taxAmount: 33282,
      grandTotal: 218182,
      totalAmount: 218182,
      currency: 'INR',
      notes: 'Company MacBook Pro 16" M3 Max for design and engineering team.',
      tags: ['#Business', '#Hardware', '#HighValue', '#TaxDeductible'],
      fileType: 'manual',
      status: 'active',
      products: [
        {
          productName: 'MacBook Pro 16" Space Black',
          brand: 'Apple',
          category: 'Electronics',
          quantity: 1,
          unitPrice: 184900,
          lineTotal: 184900,
          warrantyPeriodValue: 24,
          warrantyPeriodUnit: 'months',
          warrantyPeriodMonths: 24,
          warrantyExpiryDate: new Date('2028-02-15'),
          warrantyStatus: 'active',
          reminderEnabled: true,
        },
      ],
    },
    {
      storeName: 'Sony Center Mumbai',
      invoiceNumber: 'SC-884210',
      purchaseDate: new Date('2026-03-01'),
      category: 'Electronics',
      paymentMethod: 'UPI',
      subtotal: 26990,
      taxAmount: 4858,
      grandTotal: 31848,
      totalAmount: 31848,
      currency: 'INR',
      notes: 'Active noise cancelling wireless headphones for daily commute.',
      tags: ['#Personal', '#Audio', '#Gadgets'],
      fileType: 'manual',
      status: 'active',
      products: [
        {
          productName: 'WH-1000XM5 Wireless Headphones',
          brand: 'Sony',
          category: 'Electronics',
          quantity: 1,
          unitPrice: 26990,
          lineTotal: 26990,
          warrantyPeriodValue: 12,
          warrantyPeriodUnit: 'months',
          warrantyPeriodMonths: 12,
          warrantyExpiryDate: new Date('2027-03-01'),
          warrantyStatus: 'active',
          reminderEnabled: true,
        },
      ],
    },
    {
      storeName: 'Croma Electronics',
      invoiceNumber: 'CR-MUM-77319',
      purchaseDate: new Date('2025-11-20'),
      category: 'Appliances',
      paymentMethod: 'Debit Card',
      subtotal: 58000,
      taxAmount: 10440,
      grandTotal: 68440,
      totalAmount: 68440,
      currency: 'INR',
      notes: '4K Smart OLED TV installed in home living room.',
      tags: ['#Personal', '#Appliances', '#WarrantyExpiringSoon'],
      fileType: 'manual',
      status: 'active',
      products: [
        {
          productName: '55-inch 4K UHD Smart TV',
          brand: 'LG',
          category: 'Appliances',
          quantity: 1,
          unitPrice: 58000,
          lineTotal: 58000,
          warrantyPeriodValue: 12,
          warrantyPeriodUnit: 'months',
          warrantyPeriodMonths: 12,
          warrantyExpiryDate: new Date('2026-11-20'), // ~30 days away in 2026-10!
          warrantyStatus: 'expiring_soon',
          reminderEnabled: true,
        },
      ],
    },
    {
      storeName: 'IKEA Navi Mumbai',
      invoiceNumber: 'IK-2026-04419',
      purchaseDate: new Date('2026-01-10'),
      category: 'Home & Office',
      paymentMethod: 'Credit Card',
      subtotal: 42500,
      taxAmount: 7650,
      grandTotal: 50150,
      totalAmount: 50150,
      currency: 'INR',
      notes: 'Ergonomic sit-stand desk and mesh swivel chair for home office.',
      tags: ['#Business', '#Office', '#Furniture', '#TaxDeductible'],
      fileType: 'manual',
      status: 'active',
      products: [
        {
          productName: 'BEKANT Motorized Sit/Stand Desk',
          brand: 'IKEA',
          category: 'Home & Office',
          quantity: 1,
          unitPrice: 28500,
          lineTotal: 28500,
          warrantyPeriodValue: 120, // 10 year warranty
          warrantyPeriodUnit: 'months',
          warrantyPeriodMonths: 120,
          warrantyExpiryDate: new Date('2036-01-10'),
          warrantyStatus: 'active',
          reminderEnabled: false,
        },
        {
          productName: 'MARKUS Ergonomic Office Chair',
          brand: 'IKEA',
          category: 'Home & Office',
          quantity: 1,
          unitPrice: 14000,
          lineTotal: 14000,
          warrantyPeriodValue: 120,
          warrantyPeriodUnit: 'months',
          warrantyPeriodMonths: 120,
          warrantyExpiryDate: new Date('2036-01-10'),
          warrantyStatus: 'active',
          reminderEnabled: false,
        },
      ],
    },
    {
      storeName: 'Amazon India',
      invoiceNumber: 'AMZ-IN-908129',
      purchaseDate: new Date('2026-04-05'),
      category: 'Supplies',
      paymentMethod: 'Amazon Pay',
      subtotal: 4800,
      taxAmount: 864,
      grandTotal: 5664,
      totalAmount: 5664,
      currency: 'INR',
      notes: 'USB-C hubs, HDMI cables, and cable management ties.',
      tags: ['#Business', '#Supplies'],
      fileType: 'manual',
      status: 'active',
      products: [
        {
          productName: 'Anker 7-in-1 USB-C Hub',
          brand: 'Anker',
          category: 'Electronics',
          quantity: 1,
          unitPrice: 3800,
          lineTotal: 3800,
          warrantyPeriodValue: 18,
          warrantyPeriodUnit: 'months',
          warrantyPeriodMonths: 18,
          warrantyExpiryDate: new Date('2027-10-05'),
          warrantyStatus: 'active',
          reminderEnabled: true,
        },
      ],
    },
  ];

  let createdCount = 0;
  for (const receiptData of sampleReceipts) {
    const existing = await Receipt.findOne({
      userId: user._id,
      invoiceNumber: receiptData.invoiceNumber,
    });

    if (existing) {
      console.log(`Skipping existing receipt: ${receiptData.invoiceNumber}`);
      continue;
    }

    const { products: prodsData, ...mainData } = receiptData;
    const receiptDoc = await Receipt.create({
      ...mainData,
      userId: user._id,
      products: [],
    });

    const createdProductIds = [];
    const embeddedProducts = [];

    for (const p of prodsData) {
      const prodDoc = await Product.create({
        ...p,
        receiptId: receiptDoc._id,
        userId: user._id,
      });
      createdProductIds.push(prodDoc._id);
      embeddedProducts.push({
        _id: prodDoc._id,
        ...p,
      });
    }

    receiptDoc.products = embeddedProducts;
    await receiptDoc.save();
    createdCount++;
    console.log(`+ Created receipt: "${receiptDoc.storeName}" (${receiptDoc.invoiceNumber}) with ${prodsData.length} product(s) and tags [${receiptDoc.tags.join(', ')}]`);
  }

  console.log(`\nDone! Seeded ${createdCount} realistic test receipts.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
