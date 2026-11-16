import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Listing from '../models/Listing.js';
import Claim from '../models/Claim.js';

const ALLOWED_ROLES = ['donor', 'receiver', 'volunteer', 'admin', 'member'];

// Platform-wide key metrics summary
export async function getStats(_req, res, next) {
  try {
    const [
      totalUsers,
      donorsCount,
      receiversCount,
      volunteersCount,
      adminsCount,
      totalListings,
      activeListings,
      completedListings,
      totalClaims,
      completedClaims,
      rescuedPortionsAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'receiver' }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'admin' }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: 'available' }),
      Listing.countDocuments({ status: 'completed' }),
      Claim.countDocuments(),
      Claim.countDocuments({ status: 'completed' }),
      Claim.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalPortions: { $sum: '$quantity' } } },
      ]),
    ]);

    const totalRescuedPortions = rescuedPortionsAgg[0]?.totalPortions || 0;

    res.json({
      stats: {
        totalUsers,
        usersByRole: {
          donors: donorsCount,
          receivers: receiversCount,
          volunteers: volunteersCount,
          admins: adminsCount,
        },
        totalListings,
        activeListings,
        completedListings,
        totalClaims,
        completedClaims,
        totalRescuedPortions,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Search and filter user registry
export async function getUsers(req, res, next) {
  try {
    const { q, role, status } = req.query;
    const filter = {};

    if (role && role !== 'all' && ALLOWED_ROLES.includes(role)) {
      filter.role = role;
    }

    if (status && ['active', 'suspended'].includes(status)) {
      filter.status = status;
    }

    if (q?.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ users });
  } catch (error) {
    next(error);
  }
}

// Create a new administrator account
export async function createAdmin(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: 'Full name, email address, and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newAdmin = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    res.status(201).json({
      message: 'New administrator created successfully.',
      user: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        status: newAdmin.status,
        createdAt: newAdmin.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Update a user's platform role
export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: `Invalid role. Allowed roles: ${ALLOWED_ROLES.join(', ')}` });
    }

    // Prevent admin from removing their own privileges
    if (String(req.user.id) === String(id) && role !== 'admin') {
      return res.status(400).json({ message: 'Self-lockout prevented: You cannot remove administrator privileges from your own account.' });
    }

    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `Role for ${user.name} successfully updated to ${role}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
}

// Toggle user active / suspended status
export async function toggleUserStatus(req, res, next) {
  try {
    const { id } = req.params;

    // Prevent self-suspension
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: 'Self-lockout prevented: You cannot suspend your own account.' });
    }

    const user = await User.findById(id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.status = user.status === 'suspended' ? 'active' : 'suspended';
    await user.save();

    res.json({
      message: `User ${user.name} is now ${user.status}.`,
      user,
    });
  } catch (error) {
    next(error);
  }
}

// Listings list for moderation
export async function getAdminListings(req, res, next) {
  try {
    const { q, status } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (q?.trim()) {
      const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { foodName: { $regex: escaped, $options: 'i' } },
        { pickupLocation: { $regex: escaped, $options: 'i' } },
        { category: { $regex: escaped, $options: 'i' } },
      ];
    }

    const listings = await Listing.find(filter)
      .populate('donor', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ listings });
  } catch (error) {
    next(error);
  }
}

// Permanently remove a listing and its claims
export async function deleteAdminListing(req, res, next) {
  try {
    const { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    await Claim.deleteMany({ listing: id });
    await Listing.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `Listing "${listing.foodName}" and related claims have been permanently removed.`,
    });
  } catch (error) {
    next(error);
  }
}

// Permanently delete a suspended user account
export async function deleteAdminUser(req, res, next) {
  try {
    const { id } = req.params;

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: 'Self-lockout prevented: You cannot delete your own account.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.status !== 'suspended') {
      return res.status(400).json({
        message: 'Only suspended accounts can be permanently deleted. Please suspend this account first.',
      });
    }

    await Listing.deleteMany({ donor: id });
    await Claim.deleteMany({ receiver: id });
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: `User record for "${user.name}" (${user.email}) has been permanently deleted from the database.`,
    });
  } catch (error) {
    next(error);
  }
}
