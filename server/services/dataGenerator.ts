import { Transaction, LocationInfo, DeviceInfo } from '../../src/types/fraud';

export const CITIES = [
  { city: 'New York', country: 'US', lat: 40.7128, lon: -74.0060 },
  { city: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { city: 'Singapore', country: 'SG', lat: 1.3521, lon: 103.8198 },
  { city: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
  { city: 'Frankfurt', country: 'DE', lat: 50.1109, lon: 8.6821 },
  { city: 'Lagos', country: 'NG', lat: 6.5244, lon: 3.3792 },
  { city: 'São Paulo', country: 'BR', lat: -23.5505, lon: -46.6333 },
  { city: 'Hong Kong', country: 'HK', lat: 22.3193, lon: 114.1694 },
  { city: 'Dubai', country: 'AE', lat: 25.2048, lon: 55.2708 },
  { city: 'Sydney', country: 'AU', lat: -33.8688, lon: 151.2093 }
];

export const MERCHANTS = [
  { name: 'Amazon Web Store', category: 'ECOMMERCE', riskScore: 12 },
  { name: 'Apple Digital Store', category: 'DIGITAL_GOODS', riskScore: 18 },
  { name: 'Binance OTC Gateway', category: 'CRYPTO', riskScore: 85 },
  { name: 'Coinbase Exchange', category: 'CRYPTO', riskScore: 78 },
  { name: 'BestBuy Online', category: 'ELECTRONICS', riskScore: 42 },
  { name: 'Rolex Boutique Fifth Ave', category: 'LUXURY_JEWELRY', riskScore: 72 },
  { name: 'Whole Foods Market', category: 'GROCERY', riskScore: 5 },
  { name: 'Steam Games Global', category: 'GAMING', riskScore: 38 },
  { name: 'Casino Royale Macau', category: 'GAMBLING', riskScore: 92 },
  { name: 'Shell Express Fuel', category: 'GAS_STATION', riskScore: 25 },
  { name: 'Uber Technologies', category: 'RIDE_SHARING', riskScore: 15 },
  { name: 'Delta Air Lines Web', category: 'TRAVEL', riskScore: 35 },
  { name: 'Western Union Wire', category: 'REMITTANCE', riskScore: 88 },
  { name: 'Target Supercenter', category: 'RETAIL', riskScore: 10 }
];

export const CUSTOMER_PROFILES = [
  { id: 'CUST-10492', name: 'Alexander Wright', baseCity: 'New York', typicalAvg: 140, maxNormal: 800 },
  { id: 'CUST-20841', name: 'Sophia Chen', baseCity: 'Singapore', typicalAvg: 95, maxNormal: 650 },
  { id: 'CUST-30915', name: 'Marcus Vance', baseCity: 'London', typicalAvg: 310, maxNormal: 1500 },
  { id: 'CUST-40812', name: 'Elena Rostova', baseCity: 'Frankfurt', typicalAvg: 220, maxNormal: 1100 },
  { id: 'CUST-50193', name: 'David Kim', baseCity: 'Tokyo', typicalAvg: 180, maxNormal: 900 },
  { id: 'CUST-60281', name: 'Carlos Mendez', baseCity: 'São Paulo', typicalAvg: 85, maxNormal: 450 },
  { id: 'CUST-70344', name: 'Fatima Al-Mansoor', baseCity: 'Dubai', typicalAvg: 550, maxNormal: 4000 },
  { id: 'CUST-80419', name: 'Liam O’Connor', baseCity: 'Sydney', typicalAvg: 120, maxNormal: 700 },
  { id: 'CUST-90112', name: 'Grace Hopper', baseCity: 'New York', typicalAvg: 410, maxNormal: 2200 },
  { id: 'CUST-99201', name: 'Unknown Mule Cluster', baseCity: 'Lagos', typicalAvg: 25, maxNormal: 120 }
];

export function generateSyntheticTransactions(count = 1000): Transaction[] {
  const transactions: Transaction[] = [];
  const baseTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Past 7 days

  // Pre-seed known fraud rings for high-quality graph linkage:
  const sharedSuspiciousDevice = 'DEV-RING-779';
  const sharedSuspiciousIP = '185.220.101.5'; // Known Tor exit node IP proxy
  const cardTestingCard = '4111-2299-8833-0012';

  for (let i = 0; i < count; i++) {
    const cust = CUSTOMER_PROFILES[i % CUSTOMER_PROFILES.length];
    const merchant = MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)];
    const cityObj = CITIES.find(c => c.city === cust.baseCity) || CITIES[0];
    
    // Determine typology
    const roll = Math.random();
    let fraudPattern: string | undefined = undefined;
    let amount = Number((cust.typicalAvg * (0.6 + Math.random() * 0.8)).toFixed(2));
    let location: LocationInfo = {
      city: cityObj.city,
      country: cityObj.country,
      lat: cityObj.lat,
      lon: cityObj.lon,
      ip: `198.51.100.${(i % 240) + 1}`,
      vpnDetected: false
    };
    let device: DeviceInfo = {
      deviceId: `DEV-${cust.id.split('-')[1]}-${(i % 3) + 1}`,
      deviceType: i % 2 === 0 ? 'MOBILE' : 'DESKTOP',
      os: i % 2 === 0 ? 'iOS 17.4' : 'Windows 11',
      browser: i % 2 === 0 ? 'Mobile Safari' : 'Chrome 122',
      isNewDevice: false,
      fingerprintHash: `fp_${cust.id}_${(i % 3) + 1}`
    };
    let cardLast4 = String(1000 + (parseInt(cust.id.split('-')[1] || '1000', 10) % 8999));
    let status: Transaction['status'] = 'APPROVED';
    let riskScore = Math.floor(Math.random() * 25);
    let fraudProbability = Number((riskScore / 100).toFixed(2));
    let riskLevel: Transaction['riskLevel'] = 'LOW';

    // 1. Velocity Attack (Rapid successive bursts)
    if (roll > 0.94) {
      fraudPattern = 'VELOCITY_ATTACK';
      amount = Number((480 + Math.random() * 850).toFixed(2));
      riskScore = 82 + Math.floor(Math.random() * 14);
      fraudProbability = Number((0.85 + Math.random() * 0.12).toFixed(2));
      riskLevel = 'CRITICAL';
      status = 'FLAGGED';
      location.vpnDetected = true;
    } 
    // 2. Amount Anomaly (Sudden massive outlier 10x normal)
    else if (roll > 0.88) {
      fraudPattern = 'AMOUNT_ANOMALY';
      amount = Number((cust.maxNormal * (4 + Math.random() * 6)).toFixed(2));
      riskScore = 75 + Math.floor(Math.random() * 18);
      fraudProbability = Number((0.78 + Math.random() * 0.18).toFixed(2));
      riskLevel = 'HIGH';
      status = 'FLAGGED';
    }
    // 3. Card Testing Attack (Tiny micropayments under $2)
    else if (roll > 0.83) {
      fraudPattern = 'CARD_TESTING';
      amount = Number((0.85 + Math.random() * 1.5).toFixed(2));
      cardLast4 = cardTestingCard.slice(-4);
      riskScore = 68 + Math.floor(Math.random() * 20);
      fraudProbability = Number((0.70 + Math.random() * 0.20).toFixed(2));
      riskLevel = 'HIGH';
      status = 'FLAGGED';
      device.deviceId = sharedSuspiciousDevice;
    }
    // 4. Shared Device / IP Ring (Fraud Farm)
    else if (roll > 0.77) {
      fraudPattern = 'SHARED_DEVICE_RING';
      amount = Number((750 + Math.random() * 1200).toFixed(2));
      device.deviceId = sharedSuspiciousDevice;
      device.isNewDevice = true;
      location.ip = sharedSuspiciousIP;
      location.vpnDetected = true;
      riskScore = 88 + Math.floor(Math.random() * 10);
      fraudProbability = 0.92;
      riskLevel = 'CRITICAL';
      status = 'FLAGGED';
    }
    // 5. Impossible Travel (Geo-velocity physically impossible)
    else if (roll > 0.72) {
      fraudPattern = 'IMPOSSIBLE_TRAVEL';
      // Pick a city on the opposite side of the planet from base city
      const farCity = CITIES.find(c => c.city !== cust.baseCity) || CITIES[3];
      location = {
        city: farCity.city,
        country: farCity.country,
        lat: farCity.lat,
        lon: farCity.lon,
        ip: `193.106.191.${(i % 250) + 1}`,
        vpnDetected: true
      };
      device.isNewDevice = true;
      amount = Number((620 + Math.random() * 1400).toFixed(2));
      riskScore = 85 + Math.floor(Math.random() * 12);
      fraudProbability = 0.89;
      riskLevel = 'CRITICAL';
      status = 'FLAGGED';
    }
    // 6. Suspicious High Risk Merchant (Crypto On-ramp / Macau Casino)
    else if (roll > 0.68) {
      fraudPattern = 'HIGH_RISK_MERCHANT';
      amount = Number((1200 + Math.random() * 2400).toFixed(2));
      riskScore = 70 + Math.floor(Math.random() * 18);
      fraudProbability = 0.74;
      riskLevel = 'HIGH';
      status = 'FLAGGED';
    }
    // 7. False Positive Trap (Legitimate high spender on vacation)
    else if (roll > 0.64) {
      fraudPattern = 'FALSE_POSITIVE_VIP';
      amount = Number((cust.typicalAvg * 2.8).toFixed(2));
      riskScore = 52 + Math.floor(Math.random() * 12); // Medium-high trigger but legitimate
      fraudProbability = 0.54;
      riskLevel = 'MEDIUM';
      status = 'UNDER_REVIEW';
    }
    // 8. Normal baseline transactions
    else {
      riskScore = Math.floor(Math.random() * 28);
      fraudProbability = Number((riskScore / 100).toFixed(2));
      riskLevel = riskScore > 20 ? 'LOW' : 'LOW';
      status = 'APPROVED';
    }

    // Spread timestamps across the last 7 days, with higher density in recent hours
    const timeOffset = (i / count) * (7 * 24 * 60 * 60 * 1000);
    const timestamp = new Date(baseTime + timeOffset).toISOString();

    transactions.push({
      id: `TX-${100000 + i}`,
      customerId: cust.id,
      customerName: cust.name,
      accountNumber: `ACC-${cust.id.replace('CUST-', '')}-99`,
      amount,
      currency: 'USD',
      merchant: merchant.name,
      merchantCategory: merchant.category,
      merchantRiskScore: merchant.riskScore,
      location,
      device,
      timestamp,
      transactionType: amount > 1500 ? 'TRANSFER' : (Math.random() > 0.4 ? 'ONLINE_PAYMENT' : 'PURCHASE'),
      cardLast4,
      paymentMethod: amount > 2000 ? 'WIRE' : 'CREDIT',
      status,
      fraudProbability,
      riskScore,
      riskLevel,
      fraudPattern,
      isSynthetic: true
    });
  }

  // Sort by timestamp descending (newest first)
  return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
