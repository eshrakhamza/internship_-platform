import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a test recruiter
  const recruiterEmail = 'recruiter@company.com';
  
  const existingRecruiter = await prisma.user.findUnique({
    where: { email: recruiterEmail },
  });

  if (!existingRecruiter) {
    await prisma.user.create({
      data: {
        email: recruiterEmail,
        firstName: 'Recruiter',
        lastName: 'Admin',
        role: UserRole.RECRUITER,
        isActive: true,
      },
    });
    console.log(`✅ Created recruiter: ${recruiterEmail}`);
  }

  // Create a test admin
  const adminEmail = 'admin@company.com';
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'System',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
      },
    });
    console.log(`✅ Created admin: ${adminEmail}`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });