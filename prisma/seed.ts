import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Studio Config
  await prisma.studioConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      studioName: 'Snapbook Studio',
      whatsappNumber: '6281234567890',
      instagramHandle: '@snapbookstudio',
      openingTime: '09:00',
      closingTime: '20:00',
      slotDuration: 60,
      address: 'Jl. Studio Foto No. 10, Jakarta Selatan',
      aboutText:
        'Snapbook Studio adalah studio foto modern dengan pencahayaan profesional, set bergaya editorial, dan fotografer berpengalaman untuk mengabadikan momen berharga Anda.',
    },
  });
  console.log('✅ Studio config seeded.');

  // 2. Admin User (username: admin, password: adminpassword123)
  const passwordHash = await bcrypt.hash('adminpassword123', 10);
  await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
    },
  });
  console.log('✅ Admin user seeded (username: admin, password: adminpassword123).');

  // 3. Packages
  const packagesData = [
    {
      id: 'pkg-self-portrait',
      name: 'Self Portrait Express',
      description: 'Sesi self-photo bebas berekspresi tanpa fotografer dengan shutter nirkabel.',
      price: 150000,
      duration: 30,
      category: 'Self Portrait',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      features: JSON.stringify([
        'Hingga 2 orang (tambahan Rp 25rb/orang)',
        '30 menit sesi foto bebas',
        'Semua file digital (softcopy) original',
        '2 foto cetak 4R premium',
        'Berbagai pilihan aksesoris & properti studio',
      ]),
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'pkg-graduation',
      name: 'Graduation Special',
      description: 'Paket wisuda elegan dengan fotografer profesional dan pencahayaan studio terbaik.',
      price: 450000,
      duration: 60,
      category: 'Graduation',
      imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      features: JSON.stringify([
        'Hingga 5 orang (wisudawan + keluarga)',
        '60 menit sesi foto terarah',
        '10 foto diedit retouch profesional',
        'Semua softcopy via Google Drive',
        '1 foto cetak 10R + frame minimalis',
      ]),
      isActive: true,
      sortOrder: 2,
    },
    {
      id: 'pkg-group-family',
      name: 'Family & Group Story',
      description: 'Abadikan kehangatan keluarga besar atau kebersamaan sahabat tersayang.',
      price: 600000,
      duration: 60,
      category: 'Family',
      imageUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
      features: JSON.stringify([
        'Hingga 8 orang keluarga / sahabat',
        '60 menit sesi foto santai & natural',
        '15 foto diedit retouch resolusi tinggi',
        'Semua file original Google Drive',
        '2 foto cetak 10R bertingkat',
      ]),
      isActive: true,
      sortOrder: 3,
    },
    {
      id: 'pkg-editorial-creative',
      name: 'Editorial & Commercial',
      description: 'Sesi foto personal branding, lookbook fashion, atau portofolio model dengan creative lighting.',
      price: 950000,
      duration: 90,
      category: 'Editorial',
      imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
      features: JSON.stringify([
        '1 - 3 orang dengan konsep custom',
        '90 menit sesi foto eksklusif',
        'Creative lighting & backdrop tone',
        '20 foto retouch high-end editorial',
        'Semua RAW & high-res softcopy',
      ]),
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const pkg of packagesData) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {},
      create: pkg,
    });
  }
  console.log('✅ Packages seeded.');

  // 4. Add-Ons
  const addOnsData = [
    {
      id: 'addon-extra-print-10r',
      name: 'Ekstra Cetak 10R + Frame Kayu',
      price: 60000,
      description: 'Cetak foto ukuran 10R kualitas lab foto dengan bingkai kayu minimalis.',
      isActive: true,
    },
    {
      id: 'addon-extra-retouch',
      name: 'Ekstra Retouch (5 Foto)',
      price: 50000,
      description: 'Pembersihan kulit halus, perbaikan warna, dan tone estetis.',
      isActive: true,
    },
    {
      id: 'addon-wardrobe',
      name: 'Sewa Toga Wisuda / Jas',
      price: 75000,
      description: 'Sewa jubah wisuda lengkap topi atau set jas formal studio.',
      isActive: true,
    },
  ];

  for (const addon of addOnsData) {
    await prisma.addOn.upsert({
      where: { id: addon.id },
      update: {},
      create: addon,
    });
  }
  console.log('✅ Add-ons seeded.');

  // 5. Showcase Gallery Images
  const galleryData = [
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      title: 'Warm Editorial Portrait',
      category: 'Portrait',
      aspectRatio: 'portrait',
      sortOrder: 1,
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
      title: 'Wisuda Klasik Minimalis',
      category: 'Graduation',
      aspectRatio: 'square',
      sortOrder: 2,
    },
    {
      id: 'img-3',
      url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80',
      title: 'Momen Hangat Keluarga',
      category: 'Family',
      aspectRatio: 'landscape',
      sortOrder: 3,
    },
    {
      id: 'img-4',
      url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=800&q=80',
      title: 'Romantic Couple Session',
      category: 'Couple',
      aspectRatio: 'portrait',
      sortOrder: 4,
    },
    {
      id: 'img-5',
      url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
      title: 'Haute Couture Silhouette',
      category: 'Editorial',
      aspectRatio: 'portrait',
      sortOrder: 5,
    },
    {
      id: 'img-6',
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      title: 'Natural Light Aesthetics',
      category: 'Portrait',
      aspectRatio: 'square',
      sortOrder: 6,
    },
  ];

  for (const img of galleryData) {
    await prisma.showcaseImage.upsert({
      where: { id: img.id },
      update: {},
      create: img,
    });
  }
  console.log('✅ Showcase gallery seeded.');
  console.log('✨ All seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
