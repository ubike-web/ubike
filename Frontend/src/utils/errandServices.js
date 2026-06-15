export const ERRAND_SERVICES = [
  { id: 'grocery',   name: 'Grocery',   icon: '🛒', rate: 2500, desc: 'Supermarket & shop runs' },
  { id: 'pharmacy',  name: 'Pharmacy',  icon: '💊', rate: 2000, desc: 'Medicine pickups' },
  { id: 'documents', name: 'Documents', icon: '📄', rate: 3000, desc: 'Office & legal docs' },
  { id: 'food',      name: 'Food Runs', icon: '🍱', rate: 4500, desc: 'Daily restaurant meals' },
  { id: 'laundry',   name: 'Laundry',   icon: '👕', rate: 3000, desc: 'Pickup & drop-off' },
  { id: 'market',    name: 'Market',    icon: '🥬', rate: 2500, desc: 'Fresh produce & goods' },
  { id: 'parcels',   name: 'Parcels',   icon: '📦', rate: 3500, desc: 'City-wide delivery' },
  { id: 'bills',     name: 'Bills',     icon: '💳', rate: 1500, desc: 'Payments & utilities' },
  { id: 'household', name: 'Household', icon: '🏠', rate: 2000, desc: 'Home supplies' },
];

export const ERRAND_SERVICES_WITH_OTHER = [
  ...ERRAND_SERVICES,
  { id: 'other', name: 'Other', icon: '✏️', rate: null, desc: 'Describe your needs' },
];

export const calcCustomPrice = (desc = '') => {
  const d = desc.toLowerCase();
  let base = 2000;
  if (/daily|every day/.test(d)) base = 4500;
  else if (/twice|2\s*times|3\s*times/.test(d)) base = 3500;
  else if (/weekly|once a week/.test(d)) base = 2000;
  else if (/occasional|sometimes|rarely/.test(d)) base = 1500;
  if (/multiple|several|many/.test(d)) base = Math.round(base * 1.2);
  if (/urgent|express|rush/.test(d)) base = Math.round(base * 1.3);
  if (/heavy|bulky|large/.test(d)) base = Math.round(base * 1.2);
  if (/medical|hospital|clinic/.test(d)) base = Math.max(base, 2500);
  if (/legal|court|lawyer/.test(d)) base = Math.max(base, 3500);
  return Math.round(Math.max(1000, Math.min(8000, base)) / 500) * 500;
};
