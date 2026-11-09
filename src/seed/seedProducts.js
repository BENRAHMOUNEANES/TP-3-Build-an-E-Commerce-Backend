/**
 * Database Seed Script
 * Module: ENSTA WAMD - TD-TP 3 (DzTech Store)
 * 
 * Clears existing products and populates the database with 10 realistic
 * electronics and computing peripherals that directly match the TD-TP 2 catalog.
 * 
 * Run with: npm run seed
 */

require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const Product = require('../models/Product');

const seedProductsList = [
  {
    name: 'MacBook Air M2',
    category: 'Ordinateurs',
    price: 1299.00,
    description: 'Écran Liquid Retina 13,6 pouces, autonomie impressionnante jusqu’à 18 heures et performances M2 de nouvelle génération.',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    stock: 8
  },
  {
    name: 'AirPods Pro (2e génération)',
    category: 'Audio',
    price: 649.00,
    description: 'Réduction active du bruit 2x plus efficace, Audio spatial personnalisé avec suivi dynamique des mouvements de la tête.',
    imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
    stock: 18
  },
  {
    name: 'Samsung Galaxy Watch 6',
    category: 'Montres connectées',
    price: 699.00,
    description: 'Suivi avancé du sommeil, analyse de composition corporelle BIA, boîtier en aluminium renforcé et écran saphir.',
    imageUrl: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
    stock: 12
  },
  {
    name: 'Sony WH-1000XM5',
    category: 'Audio',
    price: 349.00,
    description: 'Casque sans fil à réduction de bruit de pointe, 8 micros intégrés, processeur V1 et 30 heures d’autonomie.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
    stock: 15
  },
  {
    name: 'iPhone 15 Pro Max',
    category: 'Smartphones',
    price: 1199.00,
    description: 'Design titane aérospatial, puce A17 Pro révolutionnaire, bouton Action personnalisable et zoom optique 5x.',
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
    stock: 9
  },
  {
    name: 'Dell XPS 15 OLED',
    category: 'Ordinateurs',
    price: 1799.00,
    description: 'Écran OLED 3.5K InfinityEdge, processeur Intel Core i7 13e génération, carte graphique NVIDIA GeForce RTX 4060.',
    imageUrl: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80',
    stock: 6
  },
  {
    name: 'iPad Air M1',
    category: 'Ordinateurs',
    price: 599.00,
    description: 'Écran Liquid Retina 10,9 pouces, puce M1 ultra-rapide, Touch ID intégré et compatibilité Apple Pencil 2.',
    imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
    stock: 11
  },
  {
    name: 'Logitech MX Master 3S',
    category: 'Accessoires',
    price: 99.00,
    description: 'Souris ergonomique sans fil avec capteur 8000 DPI Darkfield, clics silencieux et molette MagSpeed ultra-rapide.',
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80',
    stock: 25
  },
  {
    name: 'PlayStation 5 Slim',
    category: 'Gaming',
    price: 499.00,
    description: 'Console nouvelle génération ultra-fine avec disque SSD 1 To ultra-rapide, ray tracing et retour haptique DualSense.',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=600&q=80',
    stock: 7
  },
  {
    name: 'Keychron K2 V2 Wireless',
    category: 'Accessoires',
    price: 89.00,
    description: 'Clavier mécanique compact 75% Bluetooth/filaire, switchs Gateron G Pro Brown, rétroéclairage RGB personnalisable.',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
    stock: 20
  }
];

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing products...');
    const deleteResult = await Product.deleteMany({});
    console.log(`[Seed] Removed ${deleteResult.deletedCount} existing products.`);

    console.log('[Seed] Inserting sample DzTech Store products...');
    const insertedProducts = await Product.insertMany(seedProductsList);
    console.log(`[Seed] Successfully inserted ${insertedProducts.length} products:`);

    insertedProducts.forEach((p, index) => {
      console.log(`  ${index + 1}. [${p.category}] ${p.name} - $${p.price.toFixed(2)} (Stock: ${p.stock})`);
    });

    console.log('\n[Seed] Database seed completed successfully!');
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
};

// Execute if run directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  seedProductsList
};

