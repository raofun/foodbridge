import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Ensures at least one administrator account exists in the database.
 * If no admin is found, automatically creates the pre-defined default admin.
 */
export async function ensureDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return existingAdmin;
    }

    const defaultName = process.env.DEFAULT_ADMIN_NAME || 'System Administrator';
    const defaultEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@foodbridge.org').trim().toLowerCase();
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@FoodBridge2026!';

    // Check if a user with this email exists but is not an admin
    let user = await User.findOne({ email: defaultEmail });
    if (user) {
      user.role = 'admin';
      user.status = 'active';
      await user.save();
      console.log(`🌿 [Admin Bootstrap] Existing user upgraded to Administrator: ${defaultEmail}`);
      return user;
    }

    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    user = await User.create({
      name: defaultName,
      email: defaultEmail,
      passwordHash,
      role: 'admin',
      status: 'active',
    });

    console.log(`🌿 [Admin Bootstrap] Pre-defined Admin initialized: ${defaultEmail}`);
    return user;
  } catch (error) {
    console.error('⚠️ [Admin Bootstrap] Could not initialize admin account:', error.message);
  }
}
