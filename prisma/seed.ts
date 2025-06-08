import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await hash('admin', 10);
  const userPassword = await hash('user', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      first_name: 'John',
      last_name: 'Doe',
      role: 'USER',
    },
  });

  console.log('✅ Created users:', { admin: admin.email, user: user.email });

  // Create products
  const products = [
    {
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 199.99,
      image_url: 'https://example.com/headphones.jpg',
      category: 'Electronics',
      stock: 50,
    },
    {
      name: 'Smart Watch',
      description: 'Feature-rich smartwatch with health tracking',
      price: 299.99,
      image_url: 'https://example.com/smartwatch.jpg',
      category: 'Electronics',
      stock: 30,
    },
    {
      name: 'Coffee Mug',
      description: 'Ceramic coffee mug with ergonomic handle',
      price: 12.99,
      image_url: 'https://example.com/mug.jpg',
      category: 'Home',
      stock: 100,
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable bluetooth speaker with excellent sound quality',
      price: 79.99,
      image_url: 'https://example.com/speaker.jpg',
      category: 'Electronics',
      stock: 25,
    },
    {
      name: 'Laptop Stand',
      description: 'Adjustable aluminum laptop stand for better ergonomics',
      price: 45.99,
      image_url: 'https://example.com/laptop-stand.jpg',
      category: 'Office',
      stock: 40,
    },
  ];

  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData,
    });
    console.log(`✅ Created product: ${product.name}`);
  }

  // Create a cart for the user
  const cart = await prisma.cart.create({
    data: {
      user_id: user.user_id,
    },
  });

  console.log('✅ Created cart for user');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Test credentials:');
  console.log('Admin: admin@admin.com / admin');
  console.log('User: user@user.com / user');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  }); 