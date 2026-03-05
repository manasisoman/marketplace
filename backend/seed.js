/**
 * seed.js — Populate TradeHub with realistic B2B product listings
 *
 * Usage:
 *   node seed.js          — clears existing products, inserts seed data
 *   node seed.js --append — keeps existing products, only adds seeds if DB is empty
 *
 * Run from the backend/ directory after setting up your .env
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const APPEND_ONLY = process.argv.includes("--append");

// ─── Seed Data ────────────────────────────────────────────────────────────────
// 24 realistic B2B product listings across all categories.
// Images use picsum.photos (free, no API key, consistent by seed number).

const seedProducts = [
  // ── Electronics ──────────────────────────────────────────────
  {
    name: "55\" 4K Conference Room Display",
    price: 1299.00,
    description:
      "Ultra-bright 4K UHD display engineered for conference rooms. 500-nit brightness, built-in wireless screen sharing, and dual HDMI inputs. Sold in single or bulk (6-unit) configurations.",
    image: "https://picsum.photos/seed/monitor1/400/300",
    category: "Electronics",
  },
  {
    name: "Wireless Conference Speaker System",
    price: 249.99,
    description:
      "360° omnidirectional microphone array with 15-ft pickup range. Pairs seamlessly with Zoom, Teams, and Meet. USB-C and Bluetooth. Perfect for mid-size meeting rooms.",
    image: "https://picsum.photos/seed/speaker2/400/300",
    category: "Electronics",
  },
  {
    name: "Commercial Document Scanner — 80ppm",
    price: 449.00,
    description:
      "High-volume duplex scanner with 100-sheet ADF. Outputs searchable PDF, JPEG, and TIFF. Network-ready with cloud upload to SharePoint, Google Drive, and Dropbox.",
    image: "https://picsum.photos/seed/scanner3/400/300",
    category: "Electronics",
  },
  {
    name: "Wireless Ergonomic Mouse — 10-Pack",
    price: 199.00,
    description:
      "Bulk-packaged ergonomic mice ideal for office refresh programs. 2.4GHz wireless, 18-month battery life, plug-and-play USB receiver. Compatible with Windows and macOS.",
    image: "https://picsum.photos/seed/mouse4/400/300",
    category: "Electronics",
  },
  {
    name: "Industrial Label Printer — Thermal",
    price: 299.00,
    description:
      "Commercial thermal label printer, 300dpi resolution. Prints up to 4\" wide labels at 8 inches per second. Ships with USB, Ethernet, and Bluetooth connectivity.",
    image: "https://picsum.photos/seed/printer5/400/300",
    category: "Electronics",
  },
  {
    name: "USB-C Charging Cables — 50-Pack",
    price: 149.00,
    description:
      "Durable braided USB-C to USB-C cables, 6ft each. Rated for 100W fast charging and 10Gbps data transfer. Bulk-packed for IT procurement and device rollouts.",
    image: "https://picsum.photos/seed/cables6/400/300",
    category: "Electronics",
  },
  {
    name: "Adjustable Monitor Arm with USB Hub",
    price: 89.99,
    description:
      "Single-arm monitor mount with integrated 4-port USB 3.0 hub. Supports monitors up to 32\" and 17.6 lbs. Full tilt, swivel, and height adjustment. VESA 75/100 compatible.",
    image: "https://picsum.photos/seed/arm7/400/300",
    category: "Electronics",
  },
  {
    name: "Security Badge & ID Card Printer",
    price: 599.00,
    description:
      "Single-sided PVC card printer with edge-to-edge printing. 300 dpi, 150 cards/hour output. Includes 200-card ribbon and 50 blank PVC cards. USB and Ethernet ready.",
    image: "https://picsum.photos/seed/badge8/400/300",
    category: "Electronics",
  },

  // ── General ───────────────────────────────────────────────────
  {
    name: "Electric Height-Adjustable Standing Desk",
    price: 699.00,
    description:
      "Dual-motor electric standing desk with memory presets. Height range 24\"–50\". 280 lb weight capacity. Commercial-grade steel frame with scratch-resistant laminate top (60\" x 30\").",
    image: "https://picsum.photos/seed/desk9/400/300",
    category: "General",
  },
  {
    name: "Commercial Paper Shredder — 20-Sheet",
    price: 399.00,
    description:
      "Micro-cut security shredder for offices. Handles 20 sheets, staples, and credit cards per pass. 60-minute continuous run time. 18-gallon pullout waste bin.",
    image: "https://picsum.photos/seed/shredder10/400/300",
    category: "General",
  },
  {
    name: "Heavy-Duty Storage Shelving Unit — 6-Tier",
    price: 229.00,
    description:
      "Industrial-grade steel shelving unit, 6 adjustable tiers. 2,000 lb total capacity. Easy bolt-free assembly. Dimensions: 72\"H x 48\"W x 18\"D. Ideal for warehouses and stockrooms.",
    image: "https://picsum.photos/seed/shelf11/400/300",
    category: "General",
  },
  {
    name: "Commercial Drip Coffee Station",
    price: 549.00,
    description:
      "Programmable 60-cup commercial coffee brewer with dual burners. Brews a full pot in under 8 minutes. NSF-certified. Compatible with pre-ground and whole-bean setups.",
    image: "https://picsum.photos/seed/coffee12/400/300",
    category: "General",
  },
  {
    name: "Industrial First Aid Cabinet — OSHA Compliant",
    price: 179.99,
    description:
      "OSHA/ANSI Class B compliant first aid cabinet for 50-person workplaces. Wall-mounted steel cabinet with 350+ supplies: bandages, eye wash, tourniquets, and CPR kit.",
    image: "https://picsum.photos/seed/firstaid13/400/300",
    category: "General",
  },
  {
    name: "Bulk Copy Paper — Case of 10 Reams",
    price: 54.99,
    description:
      "96-bright, 20 lb, 8.5\" x 11\" multipurpose copy paper. Acid-free and archival quality. Works with all laser and inkjet printers, copiers, and fax machines. 5,000 sheets per case.",
    image: "https://picsum.photos/seed/paper14/400/300",
    category: "General",
  },
  {
    name: "6ft x 4ft Magnetic Dry-Erase Whiteboard",
    price: 189.00,
    description:
      "Commercial magnetic whiteboard with aluminum frame and marker tray. Ghost-resistant ceramic-steel surface. Includes 4 markers, eraser, and mounting hardware. Ideal for conference rooms.",
    image: "https://picsum.photos/seed/whiteboard15/400/300",
    category: "General",
  },
  {
    name: "Anti-Fatigue Standing Mat — Commercial",
    price: 74.99,
    description:
      "Ergonomic anti-fatigue floor mat for standing desk workstations. 3/4\" thick high-density foam with beveled safety edges. Non-slip bottom. 24\" x 36\". Available in black and grey.",
    image: "https://picsum.photos/seed/mat16/400/300",
    category: "General",
  },

  // ── Clothing ──────────────────────────────────────────────────
  {
    name: "High-Visibility Safety Vests — 12-Pack",
    price: 79.99,
    description:
      "ANSI Class 2 high-visibility safety vests in fluorescent yellow-green. Adjustable side closures. Certified for construction, warehousing, and traffic control. Sizes S–3XL available.",
    image: "https://picsum.photos/seed/vest17/400/300",
    category: "Clothing",
  },
  {
    name: "Corporate Embroidered Polo Shirts — Min 24",
    price: 22.00,
    description:
      "Moisture-wicking polo shirts in 12 color options. Custom logo embroidery available at no extra cost on orders of 24+. 100% polyester pique. Sizes XS–4XL. Price per unit.",
    image: "https://picsum.photos/seed/polo18/400/300",
    category: "Clothing",
  },

  // ── Food ──────────────────────────────────────────────────────
  {
    name: "Office Drip Coffee Packets — 200-Count",
    price: 49.99,
    description:
      "Single-serve drip coffee packets, medium roast blend. No machine needed — just open, hook over a mug, and pour hot water. Each packet brews 8 oz. Individually sealed for freshness.",
    image: "https://picsum.photos/seed/coffeepack19/400/300",
    category: "Food",
  },
  {
    name: "Bulk Hand Sanitizer — 5-Gallon Refill",
    price: 39.99,
    description:
      "70% ethanol hand sanitizer in 5-gallon bulk container. Compatible with all foam and liquid dispenser pumps. Kills 99.9% of germs. Unscented, non-irritating formula. EPA registered.",
    image: "https://picsum.photos/seed/sanitizer20/400/300",
    category: "Food",
  },

  // ── Home and Garden ──────────────────────────────────────────
  {
    name: "Commercial Robot Vacuum — Scheduled Cleaning",
    price: 799.00,
    description:
      "Commercial-grade robot vacuum with 3-hour battery life and 3,000 sqft coverage per charge. App-controlled scheduling, automatic charging dock, HEPA filter, and LiDAR mapping.",
    image: "https://picsum.photos/seed/vacuum21/400/300",
    category: "Home and Garden",
  },
  {
    name: "Office Plant Bundle — 6 Low-Maintenance Plants",
    price: 129.00,
    description:
      "Curated set of 6 desk and shelf plants (snake plant, pothos, ZZ plant, succulents). Ships in 4\" grow pots with care cards. Thrives under office fluorescent lighting.",
    image: "https://picsum.photos/seed/plants22/400/300",
    category: "Home and Garden",
  },

  // ── Sports ────────────────────────────────────────────────────
  {
    name: "Corporate Wellness Foam Roller Set — 10-Pack",
    price: 89.00,
    description:
      "High-density EVA foam rollers for office wellness programs. 18\" length, 6\" diameter. Includes a mesh storage bag. Color-coded by density: soft (blue), medium (black).",
    image: "https://picsum.photos/seed/foam23/400/300",
    category: "Sports",
  },

  // ── Books ─────────────────────────────────────────────────────
  {
    name: "B2B Sales Strategy Handbook — 10-Copy Bundle",
    price: 249.00,
    description:
      "Comprehensive B2B sales playbook covering pipeline management, enterprise deal cycles, and procurement negotiation. Updated 2025 edition. Bulk pricing for team training. Hardcover.",
    image: "https://picsum.photos/seed/book24/400/300",
    category: "Books",
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected.\n");

  if (APPEND_ONLY) {
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`--append mode: ${count} products already exist. Skipping seed.`);
      await mongoose.disconnect();
      return;
    }
  } else {
    const deleted = await Product.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing product(s).`);
  }

  const inserted = await Product.insertMany(seedProducts);
  console.log(`\nInserted ${inserted.length} products:\n`);
  inserted.forEach((p, i) =>
    console.log(`  ${String(i + 1).padStart(2, " ")}. [${p.category.padEnd(14)}] ${p.name} — $${p.price.toFixed(2)}`)
  );

  console.log("\nDone. Restart your backend or refresh the frontend to see the listings.");
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
