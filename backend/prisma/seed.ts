// prisma/seed.ts — Seeds the database with initial data
import { PrismaClient, Role, PostStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Create Admin User ─────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pulsenews.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@pulsenews.com',
      password: adminPassword,
      role: Role.ADMIN,
      country: 'Kenya',
      bio: 'Platform administrator',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // ── 2. Create Demo Users ─────────────────────────────────
  const userPassword = await bcrypt.hash('User@123456', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'jane@pulsenews.com' },
    update: {},
    create: {
      name: 'Jane Mwangi',
      email: 'jane@pulsenews.com',
      password: userPassword,
      country: 'Kenya',
      bio: 'Citizen journalist based in Nairobi.',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'kwame@pulsenews.com' },
    update: {},
    create: {
      name: 'Kwame Asante',
      email: 'kwame@pulsenews.com',
      password: userPassword,
      country: 'Ghana',
      bio: 'Reporting from Accra and beyond.',
    },
  });
  console.log('✅ Demo users created');

  // ── 3. Create Sample Posts ────────────────────────────────
  const posts = [
    {
      title: 'Nairobi County Launches Largest Digital Infrastructure Project in East Africa',
      description:
        'The Nairobi County Government has officially launched a groundbreaking KSh 12 billion digital infrastructure initiative that promises to transform the metropolitan area into a world-class smart city.\n\nThe project, dubbed "Smart Nairobi 2030," will see the installation of fiber optic networks across all 17 sub-counties, establishment of 200 public Wi-Fi hotspots, and deployment of smart traffic management systems.\n\nThis is a public-private partnership involving leading technology companies including Safaricom, Huawei, and several local tech startups. Phase one is expected to be completed within 18 months and will directly benefit over 4.5 million residents.',
      category: 'Technology',
      location: 'Nairobi, Kenya',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
      status: PostStatus.APPROVED,
      featured: true,
      authorId: user1.id,
      likeCount: 142,
      viewCount: 3421,
    },
    {
      title: 'Ghana Cocoa Board Records 25% Revenue Surge Amid Global Commodity Boom',
      description:
        'The Ghana Cocoa Board (COCOBOD) has reported a 25% increase in revenue for the 2025/2026 crop season, driven by soaring global commodity prices and a record-breaking cocoa harvest.\n\nThe Board announced that total export earnings reached $4.2 billion, surpassing all previous records. Chief Executive attributed the success to government investments in disease-resistant cocoa varieties, improved farmer training programs, and favorable weather conditions.',
      category: 'Business',
      location: 'Accra, Ghana',
      imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=1200&q=80',
      status: PostStatus.APPROVED,
      featured: false,
      authorId: user2.id,
      likeCount: 89,
      viewCount: 2145,
    },
    {
      title: 'African Union Agrees on Landmark Free Movement Protocol for 15 Member States',
      description:
        'In a historic breakthrough, fifteen African Union member states have ratified the Free Movement of Persons protocol, marking the most significant continental integration milestone since the establishment of the African Continental Free Trade Area.\n\nEconomists project the free movement initiative could boost intra-African trade by up to 35% over the next decade and create an estimated 2.3 million new jobs across participating nations.',
      category: 'Politics',
      location: 'Addis Ababa, Ethiopia',
      imageUrl: 'https://images.unsplash.com/photo-1574958269340-fa927503f3dd?w=1200&q=80',
      status: PostStatus.APPROVED,
      featured: false,
      authorId: user2.id,
      likeCount: 318,
      viewCount: 7654,
    },
  ];

  for (const postData of posts) {
    const slug = slugify(postData.title, { lower: true, strict: true }) + '-' + Date.now();
    await prisma.post.upsert({
      where: { slug },
      update: {},
      create: { ...postData, slug },
    });
  }
  console.log('✅ Sample posts created');
  console.log('\n🎉 Seed complete!');
  console.log('📧 Admin: admin@pulsenews.com / Admin@123456');
  console.log('📧 User:  jane@pulsenews.com  / User@123456');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
