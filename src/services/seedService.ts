import { Package, StudioConfig } from '../types';

const INITIAL_PACKAGES: Package[] = [
  {
    id: 'self-basic',
    name: 'Essential Self-Portrait',
    description: 'Individual session in a private studio environment. Perfect for profile shots.',
    price: 95000,
    duration: 15,
    features: ['15 Min Session', '1 Fine Art Print', 'All Digital Negatives', 'Max 2 Guests'],
    category: 'Self-Photo'
  },
  {
    id: 'self-pro',
    name: 'Signature Self-Portrait',
    description: 'Extended creative time with multiple setups and backdrop options.',
    price: 175000,
    duration: 30,
    features: ['30 Min Session', '3 Fine Art Prints', 'All Digital Negatives', 'Max 4 Guests', 'Creative Props'],
    category: 'Self-Photo'
  },
  {
    id: 'grad-classic',
    name: 'Editorial Graduation',
    description: 'Academic milestones captured with high-fashion lighting and composition.',
    price: 350000,
    duration: 45,
    features: ['45 Min Session', '2 Retouched Masters', '2 Large Prints', 'Digital Archive', 'Max 5 Guests'],
    category: 'Professional'
  },
  {
    id: 'family-heritage',
    name: 'Heritage Portrait',
    description: 'Timeless family captures designed to be passed down through generations.',
    price: 550000,
    duration: 60,
    features: ['60 Min Session', '5 Retouched Masters', '1 Canvas Masterpiece', 'Digital Archive', 'Max 10 Guests'],
    category: 'Professional'
  }
];

const INITIAL_CONFIG: StudioConfig = {
  studioName: 'SnapBook Studio',
  whatsappNumber: '081234567890',
  openingTime: '09:00',
  closingTime: '21:00',
  aboutText: 'SnapBook Studio is your modern destination for high-quality photography. We specialize in self-photo sessions, professional portraits, and event coverage with an efficient and creative approach.'
};

export async function seedData() {
  const existingPkg = localStorage.getItem('packages');
  if (!existingPkg) {
    console.log('Local storage empty, ready for seeding.');
  }
}

export async function forceSeed() {
  console.log('Attempting local force seed...');
  localStorage.setItem('packages', JSON.stringify(INITIAL_PACKAGES));
  localStorage.setItem('studio_config', JSON.stringify(INITIAL_CONFIG));
  console.log('Force seed completed locally.');
}
