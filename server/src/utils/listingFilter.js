import User from '../models/User.js';

const AREA_ALIASES = {
    dhanmondi: ['dhanmondi', 'kalabagan', 'lalmatia', 'sobhanbagh', 'zigatola', 'jigatola'],
    gulshan: ['gulshan'],
    banani: ['banani', 'kemal ataturk'],
    uttara: ['uttara', 'sector'],
    mirpur: ['mirpur', 'pallabi', 'kazipara', 'shewrapara'],
    mohammadpur: ['mohammadpur', 'adabor', 'japan garden', 'taj mahal'],
    bashundhara: ['bashundhara', 'baridhara'],
    badda: ['badda', 'rampura', 'aftabnagar', 'merul'],
    'old-dhaka': ['old dhaka', 'puran', 'lalbagh', 'sadarghat', 'chawkbazar', 'wari'],
    motijheel: ['motijheel', 'paltan', 'khilgaon'],
    mohakhali: ['mohakhali', 'dohs'],
    farmgate: ['farmgate', 'panthapath', 'tejgaon'],
    malibagh: ['malibagh', 'shantinagar', 'bailey', 'moghbazar'],
    savar: ['savar', 'keraniganj', 'ashulia'],
};

export async function buildFeedFilter(queryParams = {}) {
    const {
        search,
        area,
        category,
        availability = 'all',
        pickupTime,
    } = queryParams;

    const filter = {};
    const andConditions = [];
    const now = new Date();

    if (availability === 'available') {
        filter.status = 'available';
        andConditions.push({
            $or: [
                { pickupDeadline: { $gt: now } },
                { pickupClosesAt: { $gt: now } },
                { pickupDeadline: null, pickupClosesAt: null },
            ],
        });
    } else if (availability === 'closed') {
        filter.status = { $in: ['available', 'closed'] };
        andConditions.push({
            $or: [
                { status: 'closed' },
                { pickupDeadline: { $lte: now } },
                { pickupClosesAt: { $lte: now } },
            ],
        });
    } else {
        filter.status = { $in: ['available', 'closed'] };
    }

    if (category && category !== 'all') {
        filter.category = category;
    }

    if (area && area !== 'all') {
        const areaKey = area.toLowerCase();
        const aliases = AREA_ALIASES[areaKey] || [areaKey];
        const regexStr = aliases.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        filter.pickupLocation = { $regex: regexStr, $options: 'i' };
    }

    if (pickupTime && pickupTime !== 'all') {
        if (pickupTime === 'critical') {
            const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
            andConditions.push({
                $or: [
                    { pickupDeadline: { $gt: now, $lte: oneHourLater } },
                    { pickupClosesAt: { $gt: now, $lte: oneHourLater } },
                ],
            });
        } else if (pickupTime === 'urgent') {
            const threeHoursLater = new Date(now.getTime() + 3 * 60 * 60 * 1000);
            andConditions.push({
                $or: [
                    { pickupDeadline: { $gt: now, $lte: threeHoursLater } },
                    { pickupClosesAt: { $gt: now, $lte: threeHoursLater } },
                ],
            });
        } else if (pickupTime === 'today') {
            const endOfToday = new Date(now);
            endOfToday.setHours(23, 59, 59, 999);
            andConditions.push({
                $or: [
                    { pickupDeadline: { $gt: now, $lte: endOfToday } },
                    { pickupClosesAt: { $gt: now, $lte: endOfToday } },
                ],
            });
        } else if (pickupTime === 'evening') {
            const eveningStart = new Date(now);
            eveningStart.setHours(18, 0, 0, 0);
            const endOfToday = new Date(now);
            endOfToday.setHours(23, 59, 59, 999);
            const minTime = now > eveningStart ? now : eveningStart;
            andConditions.push({
                $or: [
                    { pickupDeadline: { $gte: minTime, $lte: endOfToday } },
                    { pickupClosesAt: { $gte: minTime, $lte: endOfToday } },
                ],
            });
        } else if (pickupTime === 'upcoming') {
            const startOfTomorrow = new Date(now);
            startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
            startOfTomorrow.setHours(0, 0, 0, 0);
            andConditions.push({
                $or: [
                    { pickupDeadline: { $gte: startOfTomorrow } },
                    { pickupClosesAt: { $gte: startOfTomorrow } },
                ],
            });
        }
    }

    if (search && search.trim()) {
        const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const searchRegex = { $regex: escaped, $options: 'i' };

        const matchingDonors = await User.find({ name: searchRegex }).select('_id').lean();
        const matchingDonorIds = matchingDonors.map(u => u._id);

        const searchOr = [
            { foodName: searchRegex },
            { description: searchRegex },
            { pickupLocation: searchRegex },
        ];

        if (matchingDonorIds.length > 0) {
            searchOr.push({ donor: { $in: matchingDonorIds } });
        }

        andConditions.push({ $or: searchOr });
    }

    if (andConditions.length > 0) {
        filter.$and = andConditions;
    }

    return filter;
}
