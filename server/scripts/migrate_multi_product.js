require('dotenv').config();
const mongoose = require('mongoose');
const Receipt = require('../models/Receipt.model');
const Product = require('../models/Product.model');

async function runMigration() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/billbox';
    console.log('[Migration] Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    const receipts = await Receipt.find({});
    console.log(`[Migration] Found ${receipts.length} receipt(s) to process.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const receipt of receipts) {
      // Check if products already exist for this receipt
      const existingProductCount = await Product.countDocuments({ receiptId: receipt._id });

      if (existingProductCount > 0) {
        skippedCount++;
        continue;
      }

      // Convert legacy single-product fields into 1 Product document
      const legacyObj = receipt.toObject();
      const prodName = legacyObj.productName || 'Item 1';
      const grandVal = legacyObj.grandTotal || legacyObj.totalAmount || null;

      await Product.create({
        receiptId: receipt._id,
        userId: receipt.userId,
        productName: prodName,
        brand: legacyObj.brand || '',
        category: legacyObj.category || 'Others',
        quantity: 1,
        unitPrice: grandVal,
        lineTotal: grandVal,
        warrantyPeriodValue: legacyObj.warrantyPeriodValue || null,
        warrantyPeriodUnit: legacyObj.warrantyPeriodUnit || 'months',
        warrantyPeriodMonths: legacyObj.warrantyPeriodMonths || null,
        warrantyExpiryDate: legacyObj.warrantyExpiryDate || null,
        warrantyStatus: legacyObj.warrantyStatus || 'none',
        remindersSent: legacyObj.remindersSent || { days30: false, days15: false, days7: false, days1: false },
      });

      // Update receipt with grandTotal / subtotal and unset legacy single-product fields
      await Receipt.updateOne(
        { _id: receipt._id },
        {
          $set: {
            grandTotal: grandVal,
            subtotal: legacyObj.subtotal || grandVal,
            totalAmount: grandVal,
          },
          $unset: {
            productName: 1,
            brand: 1,
            category: 1,
            warrantyPeriodValue: 1,
            warrantyPeriodUnit: 1,
            warrantyPeriodMonths: 1,
            warrantyExpiryDate: 1,
            warrantyStatus: 1,
            remindersSent: 1,
          },
        }
      );

      migratedCount++;
    }

    console.log(`[Migration Complete] Migrated ${migratedCount} receipt(s). Skipped ${skippedCount} already-migrated receipt(s).`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]', err);
    process.exit(1);
  }
}

runMigration();
