import React from 'react';
import { MapPin } from 'lucide-react';
import './DonorProfileSection.css';

const DHAKA_NEIGHBORHOODS = [
  'Mirpur',
  'Uttara',
  'Dhanmondi',
  'Gulshan',
  'Banani',
  'Old Dhaka',
  'Karwan Bazar',
  'Mohammadpur',
  'Motijheel',
  'Badda',
  'Baridhara',
  'Khilgaon',
  'Bashundhara',
  'Tejgaon',
  'Rampura',
  'Wari',
  'Lalbagh',
];

/**
 * Parses raw donor and pickup data to cleanly separate organization name and neighborhood.
 * Example:
 *   "Rajshahi Fruit Express Mirpur" -> orgName: "Rajshahi Fruit Express", location: "Mirpur"
 *   "Rajshahi Fruit Express, Mirpur" -> orgName: "Rajshahi Fruit Express", location: "Mirpur"
 */
export function parseDonorDetails(donor, pickupLocation) {
  const rawName = (typeof donor === 'string' ? donor : donor?.name) || 'Community Donor';
  const avatarUrl = donor?.avatarUrl || donor?.photoUrl || donor?.logoUrl;
  const role = donor?.role;

  let orgName = rawName.trim();
  let location = '';

  // 1. If name contains a comma (e.g. "Rajshahi Fruit Express, Mirpur")
  if (orgName.includes(',')) {
    const parts = orgName.split(',').map((s) => s.trim());
    if (parts.length >= 2 && parts[1]) {
      orgName = parts[0];
      location = parts[1];
    }
  }

  // 2. Extract neighborhood from pickupLocation if available
  if (!location && pickupLocation) {
    const matched = DHAKA_NEIGHBORHOODS.find((n) =>
      pickupLocation.toLowerCase().includes(n.toLowerCase())
    );
    if (matched) {
      location = matched;
    } else {
      location = pickupLocation.split(',')[0].trim();
    }
  }

  // 3. If orgName ends with a known neighborhood (e.g. "Rajshahi Fruit Express Mirpur")
  for (const n of DHAKA_NEIGHBORHOODS) {
    const regex = new RegExp(`\\s+${n}$`, 'i');
    if (regex.test(orgName)) {
      orgName = orgName.replace(regex, '').trim();
      if (!location) {
        location = n;
      }
      break;
    }
  }

  // 4. Default fallback location if still empty
  if (!location) {
    location = donor?.location || 'Dhaka';
  }

  // Compute initials (e.g. "Rajshahi Fruit Express" -> "RF")
  const words = orgName.split(/\s+/).filter(Boolean);
  let initials = 'FB';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0][0].toUpperCase();
  }

  return {
    orgName,
    location,
    initials,
    avatarUrl,
    role: role && role !== 'member' ? role : null,
  };
}

export default function DonorProfileSection({
  donor,
  pickupLocation,
  size = 'default',
  className = '',
}) {
  const { orgName, location, initials, avatarUrl, role } = parseDonorDetails(
    donor,
    pickupLocation
  );

  return (
    <div className={`donor-profile-badge ${size} ${className}`.trim()}>
      <div className="donor-avatar-circle" aria-hidden="true">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={orgName}
            className="donor-avatar-img"
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span
          className="donor-avatar-fallback"
          style={{ display: avatarUrl ? 'none' : 'flex' }}
        >
          {initials}
        </span>
      </div>

      <div className="donor-profile-text-group">
        <span className="donor-label-subtle">Listed by</span>
        <div className="donor-name-heading-row">
          <span className="donor-org-name" title={orgName}>
            {orgName}
          </span>
          {role && <span className="donor-role-tag">{role}</span>}
        </div>
        <div className="donor-location-line">
          <MapPin size={11} className="donor-pin-icon" />
          <span className="donor-location-name" title={location}>
            {location}
          </span>
        </div>
      </div>
    </div>
  );
}
