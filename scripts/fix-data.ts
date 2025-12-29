import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration thresholds
const PRICE_THRESHOLD = 30000; // If price/sqm > 30k for these tier cities, assume it's total price
const TRANSPORT_KEYWORDS = ['覆盖', '乡镇', '乡村', '部分', '无', '有'];

async function fixData() {
  console.log('🚀 Starting Data Cleaning Process...\n');
  
  const tangpingCities = await prisma.tangpingCity.findMany({
    include: {
      city: true,
      living: true,
      housing: true,
      transport: true,
    },
  });

  console.log(`Checking ${tangpingCities.length} cities for data issues...\n`);

  let transportFixedCount = 0;
  let housingFixedCount = 0;

  for (const tc of tangpingCities) {
    const cityName = tc.city.name;
    let updates: any = {};
    let housingUpdates: any = {};
    let transportUpdates: any = {};
    let livingUpdates: any = {};
    let needsUpdate = false;

    // ---------------------------------------------------------
    // 1. Fix Transport Shift (Data drifted into Consumption Level)
    // ---------------------------------------------------------
    if (tc.living?.consumptionLevelRaw) {
      const rawValue = tc.living.consumptionLevelRaw;
      
      // If consumption level looks like transport data
      if (TRANSPORT_KEYWORDS.some(kw => rawValue.includes(kw)) && !rawValue.includes('高') && !rawValue.includes('低') && !rawValue.includes('中')) {
        console.log(`🔧 [${cityName}] Fixing Transport Shift: Consumption '${rawValue}' looks like transport data.`);
        
        // Move this value to airplaneRaw (as a starting point for transport shift)
        // In a real shift, all subsequent columns shift too, but we handle the most obvious symptom here.
        // We will reset consumption to UNKNOWN and try to patch transport if it's missing.
        
        livingUpdates.consumptionLevelRaw = null;
        livingUpdates.consumptionLevel = 'UNKNOWN';
        
        // If airplane data is missing or looks wrong, fill it
        if (!tc.transport?.airplaneRaw || tc.transport.airplaneRaw === '-') {
             transportUpdates.airplaneRaw = rawValue;
             transportUpdates.hasAirport = rawValue.includes('覆盖');
             // Recalculate enum
             if (rawValue.includes('覆盖')) transportUpdates.airplane = 'FULL';
             else if (rawValue.includes('乡镇') || rawValue.includes('乡村')) transportUpdates.airplane = 'TOWN_LEVEL';
             else if (rawValue.includes('部分')) transportUpdates.airplane = 'PARTIAL';
             else transportUpdates.airplane = 'NONE';
        }
        
        transportFixedCount++;
        needsUpdate = true;
      }
    }

    // ---------------------------------------------------------
    // 2. Fix Housing Price (Total Price misclassified as Unit Price)
    // ---------------------------------------------------------
    if (tc.housing?.avgSecondHandPriceNum) {
      const price = tc.housing.avgSecondHandPriceNum;
      
      // Heuristic: If unit price > 30,000 (and it's not a top tier city like Beijing/Shanghai/Shenzhen)
      // Most "lying flat" cities should be well below 15,000.
      if (price > PRICE_THRESHOLD) {
        console.log(`🔧 [${cityName}] Fixing Housing Price: ${price} seems too high for unit price. Moving to Suite Price.`);
        
        // Move to suite price
        housingUpdates.suitePriceNum = price;
        housingUpdates.suitePrice = tc.housing.avgSecondHandPrice; // Keep original text
        
        // Estimate unit price (assuming ~60m for a small suite in these cities)
        // This is a rough estimation to make the map usable
        const estimatedUnitPrice = Math.floor(price / 60);
        housingUpdates.avgSecondHandPriceNum = estimatedUnitPrice;
        housingUpdates.avgSecondHandPrice = `(估)${estimatedUnitPrice}元/m²`;

        housingFixedCount++;
        needsUpdate = true;
      }
    }

    // ---------------------------------------------------------
    // Apply Updates
    // ---------------------------------------------------------
    if (needsUpdate) {
      // Update Living
      if (Object.keys(livingUpdates).length > 0) {
        await prisma.cityLiving.update({
          where: { id: tc.living!.id },
          data: livingUpdates
        });
      }

      // Update Transport
      if (Object.keys(transportUpdates).length > 0) {
        // Ensure transport record exists
        if (tc.transport) {
            await prisma.cityTransport.update({
                where: { id: tc.transport.id },
                data: transportUpdates
            });
        }
      }

      // Update Housing
      if (Object.keys(housingUpdates).length > 0) {
        await prisma.cityHousing.update({
          where: { id: tc.housing!.id },
          data: housingUpdates
        });
      }
    }
  }

  console.log('\n✅ Data Cleaning Complete!');
  console.log(`   - Fixed Transport Data Shift: ${transportFixedCount} cities`);
  console.log(`   - Fixed Housing Price Errors: ${housingFixedCount} cities`);
}

fixData()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
