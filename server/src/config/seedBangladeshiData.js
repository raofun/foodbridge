import Listing from '../models/Listing.js';
import User from '../models/User.js';

export const BANGLADESHI_DEMO_LISTINGS = [
  // 1. Standard Today Range (Meals)
  {
    foodName: 'Old Dhaka Shahi Mutton Kacchi Biryani',
    description: 'Authentic Old Dhaka style Dum Kacchi Biryani prepared with fragrant Chinigura rice, tender spiced mutton, and golden potatoes, accompanied by traditional spiced Borhani yoghurt drink. Leftover from a corporate lunch banquet, packed in fresh thermal food boxes.',
    photoUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
    category: 'meals',
    quantity: 18,
    portionUnit: 'meal boxes',
    foodCondition: 'fresh',
    storageDetails: 'Kept in insulated thermal catering boxes at 65°C. Consume within 3 hours or refrigerate.',
    safetyNotes: '100% Halal. Contains mustard oil, milk/yoghurt (borhani), whole spices. No artificial food colors.',
    pickupLocation: 'Nazira Bazar, Old Dhaka (Near Bismillah Kabab), Dhaka 1100',
    timeType: 'today_range',
    status: 'available',
    donorName: 'Sultans Dine Community Kitchen',
    donorEmail: 'sultans.dine.dhaka@foodbridge.org',
  },

  // 2. Flexible Pickup Window (Bakery)
  {
    foodName: 'Crispy Daccai Bakarkhani & Sweet Sheermal',
    description: 'Freshly baked batch of traditional flaky Daccai Bakarkhani biscuits and warm saffron-infused Sheermal flatbreads from our morning oven run. Surplus inventory packaged in clean bakery paper bags. Available for flexible pickup anytime.',
    photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
    category: 'bakery',
    quantity: 24,
    portionUnit: 'packets (4 pcs)',
    foodCondition: 'fresh',
    storageDetails: 'Kept at ambient dry temperature in bakery grade paper bags. Shelf life 4-5 days.',
    safetyNotes: 'Contains wheat flour, ghee, sugar, cardamom, sesame seeds. 100% Vegetarian.',
    pickupLocation: 'Road 27, Dhanmondi (Behind Rapa Plaza), Dhaka 1209',
    timeType: 'flexible',
    status: 'available',
    donorName: 'Bengal Loaf & Bakery Dhanmondi',
    donorEmail: 'bengal.bakery.dhanmondi@foodbridge.org',
  },

  // 3. Flexible Pickup Window (Produce)
  {
    foodName: 'Fresh Farm Red Potatoes & Country Cauliflower',
    description: 'Freshly harvested organic red potatoes (Lal Aloo) and snow-white winter cauliflowers transported this dawn from Munshiganj farmers market. Cleaned, sorted, and bagged in ventilated jute sacks. Flexible collection throughout the day.',
    photoUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
    category: 'produce',
    quantity: 8,
    portionUnit: 'sacks (~15 kg)',
    foodCondition: 'fresh',
    storageDetails: 'Stored in a cool, ventilated ground-floor store room at 20°C away from direct sunlight.',
    safetyNotes: 'Unprocessed, farm fresh vegetables. Wash thoroughly with clean water before cooking.',
    pickupLocation: 'Karwan Bazar Kitchen Market, Gate 3, Dhaka 1215',
    timeType: 'flexible',
    status: 'available',
    donorName: 'Krishi Shombhar Agro Supply',
    donorEmail: 'krishi.karwanbazar@foodbridge.org',
  },

  // 4. Open-ended "From" Timestamp (Meals)
  {
    foodName: 'Sonali Polao Bhuna Khichuri & Egg Korma',
    description: 'Comforting yellow Bhuna Khichuri simmered with roasted moong dal, ginger paste, and aromatic spices, served with tender boiled egg korma and crispy spiced eggplant (Begun Bhaja). Prepared for a community meeting.',
    photoUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
    category: 'meals',
    quantity: 20,
    portionUnit: 'lunch containers',
    foodCondition: 'refrigerated',
    storageDetails: 'Packaged into food-grade 1-compartment meal containers, cooled quickly and stored at 3°C. Ready to reheat.',
    safetyNotes: '100% Halal. Contains boiled farm eggs, lentils, mustard oil. Free from artificial preservatives.',
    pickupLocation: 'Gulshan-2 Circle (Beside DCC North Market), Dhaka 1212',
    timeType: 'open_ended',
    status: 'available',
    donorName: 'Gulshan Community Care Food Circle',
    donorEmail: 'gulshan.care@foodbridge.org',
  },

  // 5. Evening Range (Bakery / Sweets)
  {
    foodName: 'Tangail Porabari Chamcham & Mini Roshogolla',
    description: 'High quality traditional cottage cheese (Chhana) sweets soaked in light cardamom sugar syrup, with soft mawa coating. Surplus stock from celebration orders at our confectionery kitchen.',
    photoUrl: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
    category: 'bakery',
    quantity: 12,
    portionUnit: 'sealed boxes (1 kg)',
    foodCondition: 'refrigerated',
    storageDetails: 'Sealed in air-tight sweet boxes, kept in display refrigerator at 4°C.',
    safetyNotes: 'Contains pure cow milk (chhana), sugar, pistachios, cardamom. Vegetarian.',
    pickupLocation: 'Sector 11, Sonargaon Janapath Road, Uttara, Dhaka 1230',
    timeType: 'today_evening',
    status: 'available',
    donorName: 'Mithai Ghor Uttara',
    donorEmail: 'mithaighor.uttara@foodbridge.org',
  },

  // 6. Scheduled for Tomorrow (Produce)
  {
    foodName: 'Fresh Rajshahi Amropali Sweet Mango Crates',
    description: 'Sweet, aromatic seasonal mangoes directly procured from Rajshahi orchards. Cleaned, ripened naturally without calcium carbide, and packed with newspaper cushioning in plastic harvest crates.',
    photoUrl: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
    category: 'produce',
    quantity: 10,
    portionUnit: 'crates (~12 kg)',
    foodCondition: 'fresh',
    storageDetails: 'Ambient room temperature, shaded and well ventilated. Ready to eat.',
    safetyNotes: 'Naturally ripened chemical-free mangoes. Wash skin before peeling.',
    pickupLocation: 'Mirpur 10 Roundabout (Near Fire Service Station), Dhaka 1216',
    timeType: 'tomorrow',
    status: 'available',
    donorName: 'Rajshahi Fruit Express Mirpur',
    donorEmail: 'rajshahi.fruits.mirpur@foodbridge.org',
  },

  // 7. EXPIRED LISTING 1 (Meals - Closed earlier today)
  {
    foodName: 'Dhaka Morning Chitoi Pitha & Ilish Bhorta',
    description: 'Traditional clay-stove steamed rice cakes (Chitoi Pitha) served with smoked Hilsa fish bhorta and spicy coriander paste. Breakfast surplus from morning lake stall.',
    photoUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
    category: 'meals',
    quantity: 15,
    portionUnit: 'plates',
    foodCondition: 'fresh',
    storageDetails: 'Covered banana-leaf containers.',
    safetyNotes: 'Contains fish bones, green chilies, mustard oil. Halal.',
    pickupLocation: 'Dhanmondi Lake Amphitheatre Pitha Stall, Dhaka 1209',
    timeType: 'expired_morning',
    status: 'closed',
    donorName: 'Dhanmondi Lake Pitha Corner',
    donorEmail: 'dhanmondi.pitha@foodbridge.org',
  },

  // 8. EXPIRED LISTING 2 (Meals - Closed this afternoon)
  {
    foodName: 'Old Dhaka Wedding Morog Polao & Shami Kabab',
    description: 'Aromatic Chinigura rice cooked in rich chicken broth with whole country chicken roast and tender spiced shami kababs from an afternoon wedding event.',
    photoUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=480&h=320&auto=format&fit=crop&q=70&fm=webp',
    category: 'meals',
    quantity: 25,
    portionUnit: 'banquet packs',
    foodCondition: 'refrigerated',
    storageDetails: 'Chilled in walk-in cooler.',
    safetyNotes: '100% Halal chicken. Contains dairy (ghee), nuts, fried onions.',
    pickupLocation: 'Chawkbazar Shahi Community Center, Old Dhaka 1211',
    timeType: 'expired_afternoon',
    status: 'closed',
    donorName: 'Chawkbazar Banquet Catering',
    donorEmail: 'chawkbazar.catering@foodbridge.org',
  },
];

export async function seedBangladeshiListings() {
  try {
    const now = new Date();

    // Remove previous batch to allow updated timestamps (flexible, tomorrow, expired) to apply cleanly
    const existingNames = BANGLADESHI_DEMO_LISTINGS.map(item => item.foodName);
    await Listing.deleteMany({ foodName: { $in: existingNames } });

    for (const item of BANGLADESHI_DEMO_LISTINGS) {
      let donor = await User.findOne({ email: item.donorEmail });
      if (!donor) {
        donor = await User.create({
          name: item.donorName,
          email: item.donorEmail,
          role: 'member',
        });
      }

      let pickupOpensAt = null;
      let pickupClosesAt = null;

      if (item.timeType === 'today_range') {
        pickupOpensAt = new Date(now.getTime() - 30 * 60 * 1000); // started 30 mins ago
        pickupClosesAt = new Date(now.getTime() + 4 * 3600 * 1000); // closes in 4 hours
      } else if (item.timeType === 'flexible') {
        pickupOpensAt = null; // No fixed start/end -> "Flexible pickup window"
        pickupClosesAt = null;
      } else if (item.timeType === 'open_ended') {
        pickupOpensAt = new Date(now.getTime() + 15 * 60 * 1000); // opens in 15 mins
        pickupClosesAt = null; // Open ended -> "Today · from X:XX PM"
      } else if (item.timeType === 'today_evening') {
        pickupOpensAt = new Date(now.getTime() + 2 * 3600 * 1000);
        pickupClosesAt = new Date(now.getTime() + 6 * 3600 * 1000);
      } else if (item.timeType === 'tomorrow') {
        const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
        tomorrow.setHours(10, 0, 0, 0);
        pickupOpensAt = new Date(tomorrow);
        const tomorrowClose = new Date(tomorrow);
        tomorrowClose.setHours(16, 0, 0, 0);
        pickupClosesAt = tomorrowClose;
      } else if (item.timeType === 'expired_morning') {
        pickupOpensAt = new Date(now.getTime() - 6 * 3600 * 1000); // 6 hours ago
        pickupClosesAt = new Date(now.getTime() - 2 * 3600 * 1000); // closed 2 hours ago
      } else if (item.timeType === 'expired_afternoon') {
        pickupOpensAt = new Date(now.getTime() - 4 * 3600 * 1000); // 4 hours ago
        pickupClosesAt = new Date(now.getTime() - 45 * 60 * 1000); // closed 45 mins ago
      }

      await Listing.create({
        donor: donor._id,
        foodName: item.foodName,
        description: item.description,
        photoUrl: item.photoUrl,
        category: item.category,
        quantity: item.quantity,
        portionUnit: item.portionUnit,
        foodCondition: item.foodCondition,
        storageDetails: item.storageDetails,
        safetyNotes: item.safetyNotes,
        pickupLocation: item.pickupLocation,
        preparedAt: new Date(now.getTime() - 2 * 3600 * 1000),
        pickupOpensAt,
        pickupClosesAt,
        pickupDeadline: pickupClosesAt,
        status: item.status,
      });
    }

    console.log(`Successfully seeded ${BANGLADESHI_DEMO_LISTINGS.length} Bangladeshi listings with varied timestamps (flexible, ranges, upcoming, and expired).`);
  } catch (error) {
    console.error('Failed to seed Bangladeshi demo listings:', error.message);
  }
}
