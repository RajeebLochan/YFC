const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 8 * 60 * 60 * 1000);
const adminSessions = new Map();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(storedPassword, inputPassword) {
  if (typeof storedPassword !== 'string' || typeof inputPassword !== 'string') {
    return false;
  }

  if (!storedPassword.startsWith('scrypt$')) {
    return storedPassword === inputPassword;
  }

  const parts = storedPassword.split('$');
  if (parts.length !== 3) return false;

  const salt = parts[1];
  const originalHash = Buffer.from(parts[2], 'hex');
  const inputHash = crypto.scryptSync(inputPassword, salt, 64);

  if (originalHash.length !== inputHash.length) return false;
  return crypto.timingSafeEqual(originalHash, inputHash);
}

function createAdminSession(username) {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, {
    username,
    expiresAt: Date.now() + ADMIN_SESSION_TTL_MS,
  });
  return token;
}

function requireAdminAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const session = adminSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  if (Date.now() > session.expiresAt) {
    adminSessions.delete(token);
    return res.status(401).json({ error: 'Session expired' });
  }

  req.admin = { username: session.username, token };
  return next();
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function safeParseItems(itemsJson) {
  try {
    return JSON.parse(itemsJson || '[]');
  } catch (error) {
    return [];
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // No origin header (same-origin request, server-to-server, CRA proxy, curl) — allow
    if (!origin) return callback(null, true);

    // If an explicit allow-list is configured via CORS_ORIGINS env var, enforce it
    if (configuredOrigins.length > 0) {
      return callback(
        configuredOrigins.includes(origin) ? null : new Error('Not allowed by CORS'),
        configuredOrigins.includes(origin),
      );
    }

    // No allow-list configured — allow all origins.
    // This covers: localhost dev, LAN access (phones/tablets), self-hosted installs.
    // Set CORS_ORIGINS in your .env to restrict access in a public deployment.
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(bodyParser.json());

// Database path
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// ========== DEFAULT MENU DATA ==========
const defaultRestaurants = [
  {
    id: 'yfc_1',
    name: 'YFC - Your Favourite Coffee',
    image: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?w=500',
    cuisine: 'Coffee & Snacks',
    rating: 4.5,
    deliveryTime: '30-40 min',
    minOrder: 50,
    featured: 1,
  },
  {
    id: 'ratan_1',
    name: 'Ratan Tea & Snacks',
    image: 'https://www.shutterstock.com/shutterstock/videos/1107501367/thumb/1.jpg?ip=x480',
    cuisine: 'Tea, Snacks & Sweets',
    rating: 4.3,
    deliveryTime: '25-35 min',
    minOrder: 30,
    featured: 1,
  },
  {
    id: 'sweet_1',
    name: 'Bengal Sweets',
    image: 'https://content.jdmagicbox.com/comp/ludhiana/g4/0161px161.x161.181004113418.y7g4/catalogue/bengali-sweets-ludhiana-0ffhyapkqz.jpg',
    cuisine: 'Bengali Sweets',
    rating: 4.7,
    deliveryTime: '35-45 min',
    minOrder: 100,
    featured: 1,
  },
];

const defaultMenuItems = [
  // YFC items
  { id: 'yfc_coffee_1', restaurantId: 'yfc_1', name: '✨ SPECIAL CREAMY COFFEE', price: 50, category: 'coffee', description: 'Signature 150-200ml Cappuccino', popular: 1, isVeg: 1, image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=500' },
  { id: 'yfc_coffee_2', restaurantId: 'yfc_1', name: 'NORMAL COFFEE', price: 20, category: 'coffee', description: 'Fresh brewed regular coffee', popular: 0, isVeg: 1, image: 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?w=500' },
  { id: 'yfc_coffee_3', restaurantId: 'yfc_1', name: 'COLD COFFEE', price: 30, category: 'coffee', description: 'Chilled creamy coffee', popular: 0, isVeg: 1, image: 'https://plus.unsplash.com/premium_photo-1663933534262-5de49eb4f59f?w=600&auto=format&fit=crop&q=60' },
  { id: 'yfc_rolls_1', restaurantId: 'yfc_1', name: 'EGG ROLL', price: 60, category: 'rolls', description: 'Spicy egg wrapped in paratha', popular: 0, isVeg: 0, image: 'https://i.ytimg.com/vi/p_Lq7l8JCYY/maxresdefault.jpg' },
  { id: 'yfc_rolls_2', restaurantId: 'yfc_1', name: 'VEG ROLL', price: 50, category: 'rolls', description: 'Fresh vegetable roll', popular: 0, isVeg: 1, image: 'https://i.ytimg.com/vi/6Olh2qOht2E/maxresdefault.jpg' },
  { id: 'yfc_bakery_1', restaurantId: 'yfc_1', name: 'PASTREE', price: 40, category: 'bakery', description: 'Fresh cream pastry', popular: 1, isVeg: 1, image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?w=500' },
  { id: 'yfc_bakery_2', restaurantId: 'yfc_1', name: 'BIRTHDAY CAKE (1/2 KG)', price: 300, category: 'bakery', description: 'Customizable birthday cake', popular: 1, isVeg: 1, image: 'https://images.pexels.com/photos/1721934/pexels-photo-1721934.jpeg?w=500' },
  { id: 'yfc_sweets_1', restaurantId: 'yfc_1', name: 'DAIRY MILK', price: 10, category: 'sweets', description: 'Creamy milk sweet', popular: 0, isVeg: 1, image: 'https://images.unsplash.com/photo-1638275995244-26a3f3a2ed49?w=600&auto=format&fit=crop&q=60' },
  { id: 'yfc_sweets_2', restaurantId: 'yfc_1', name: 'RASGULLA (PER PIECE)', price: 10, category: 'sweets', description: 'Soft & spongy Bengali sweet', popular: 0, isVeg: 1, image: 'https://images.pond5.com/famous-bengali-or-indian-sweets-footage-278852815_iconl.jpeg' },
  // Ratan items
  { id: 'ratan_tea_1', restaurantId: 'ratan_1', name: 'MASALA TEA', price: 15, category: 'tea', description: 'Fresh brewed masala tea', popular: 0, isVeg: 1, image: 'https://im.whatshot.in/img/2019/Sep/shutterstock-1024718095-1-1567682800.jpg' },
  { id: 'ratan_tea_2', restaurantId: 'ratan_1', name: 'GINGER TEA', price: 20, category: 'tea', description: 'Refreshing ginger tea', popular: 0, isVeg: 1, image: 'https://media.istockphoto.com/id/914152174/photo/hot-ginger-tea-cup-with-ginger-roots-on-wood-background.jpg?s=612x612&w=0&k=20' },
  { id: 'ratan_sweets_1', restaurantId: 'ratan_1', name: 'GULAB JAMUN', price: 20, category: 'sweets', description: '2 pieces - Hot & soft', popular: 1, isVeg: 1, image: 'https://wallpapercave.com/wp/wp2157192.jpg' },
  // Bengal Sweets items
  { id: 'bengal_1', restaurantId: 'sweet_1', name: 'ROSOGOLLA', price: 120, category: 'sweets', description: '4 pieces - Soft & spongy', popular: 1, isVeg: 1, image: 'https://images.pond5.com/famous-bengali-or-indian-sweets-footage-278852815_iconl.jpeg' },
  { id: 'bengal_3', restaurantId: 'sweet_1', name: 'MISHTI DOI', price: 150, category: 'sweets', description: 'Sweet yogurt - 200ml', popular: 1, isVeg: 1, image: 'https://cdn.prod.website-files.com/64931d2aee18510b47f4bb1f/6685ac20f1316f7a50ffe27c_Mishti-Doi-Recipe-Cover-Image.jpg' },
];

// Create tables if they don't exist
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT UNIQUE,
      customerName TEXT,
      customerPhone TEXT,
      address TEXT,
      items TEXT,
      total REAL,
      paymentMethod TEXT,
      status TEXT DEFAULT 'pending',
      rating INTEGER DEFAULT 0,
      review TEXT DEFAULT '',
      latitude REAL,
      longitude REAL,
      google_map_link TEXT DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Admin users table
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, () => {
    if (ADMIN_USERNAME && ADMIN_PASSWORD) {
      db.get('SELECT id FROM admins WHERE username = ?', [ADMIN_USERNAME], (err, row) => {
      if (err) {
        console.error('Failed checking admin account:', err.message);
        return;
      }

      if (!row && ADMIN_PASSWORD) {
        const passwordHash = hashPassword(ADMIN_PASSWORD);
        db.run('INSERT INTO admins (username, password) VALUES (?, ?)', [ADMIN_USERNAME, passwordHash], (insertErr) => {
          if (!insertErr) {
            console.log(`✅ Default admin account created (${ADMIN_USERNAME})`);
          }
        });
      }
      });
    } else {
      console.warn('Admin bootstrap skipped: set ADMIN_USERNAME and ADMIN_PASSWORD to create an account.');
    }

    // Migrate legacy plaintext passwords to scrypt hash.
    db.all('SELECT id, password FROM admins', (allErr, rows) => {
      if (allErr || !rows) return;
      rows.forEach((admin) => {
        if (typeof admin.password === 'string' && !admin.password.startsWith('scrypt$')) {
          const migratedHash = hashPassword(admin.password);
          db.run('UPDATE admins SET password = ? WHERE id = ?', [migratedHash, admin.id]);
        }
      });
    });
  });

  // Restaurants table
  db.run(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT,
      cuisine TEXT,
      rating REAL DEFAULT 4.0,
      deliveryTime TEXT DEFAULT '30-40 min',
      minOrder INTEGER DEFAULT 50,
      featured INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, () => {
    // Seed default restaurants if empty
    db.get('SELECT COUNT(*) as count FROM restaurants', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare('INSERT OR IGNORE INTO restaurants (id, name, image, cuisine, rating, deliveryTime, minOrder, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        defaultRestaurants.forEach(r => {
          stmt.run(r.id, r.name, r.image, r.cuisine, r.rating, r.deliveryTime, r.minOrder, r.featured);
        });
        stmt.finalize();
        console.log('✅ Default restaurants seeded');
      }
    });
  });

  // Menu items table
  db.run(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      restaurantId TEXT NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT,
      description TEXT,
      popular INTEGER DEFAULT 0,
      image TEXT,
      available INTEGER DEFAULT 1,
      isVeg INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (restaurantId) REFERENCES restaurants(id)
    )
  `, () => {
    // Seed default menu items if empty
    db.get('SELECT COUNT(*) as count FROM menu_items', (err, row) => {
      if (!err && row && row.count === 0) {
        const stmt = db.prepare('INSERT OR IGNORE INTO menu_items (id, restaurantId, name, price, category, description, popular, image, isVeg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        defaultMenuItems.forEach(item => {
          stmt.run(item.id, item.restaurantId, item.name, item.price, item.category, item.description, item.popular, item.image, item.isVeg !== undefined ? item.isVeg : 1);
        });
        stmt.finalize();
        console.log('✅ Default menu items seeded');
      }
    });
  });

  // Ratings table
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT,
      rating INTEGER NOT NULL,
      review TEXT,
      customerPhone TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Database initialized at:', dbPath);
});

// ========== ADMIN LOGIN ==========
app.post('/api/admin/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '').trim();
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT id, username, password FROM admins WHERE LOWER(username) = LOWER(?)', [username], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row || !verifyPassword(row.password, password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = createAdminSession(row.username);
    res.json({
      success: true,
      token,
      user: { id: row.id, username: row.username },
      expiresInMs: ADMIN_SESSION_TTL_MS,
    });
  });
});

app.post('/api/admin/logout', requireAdminAuth, (req, res) => {
  adminSessions.delete(req.admin.token);
  res.json({ success: true });
});

// ========== ORDER ROUTES ==========

// Get all orders
app.get('/api/orders', requireAdminAuth, (req, res) => {
  db.all('SELECT * FROM orders ORDER BY createdAt DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const orders = rows.map(row => ({
      ...row,
      items: safeParseItems(row.items)
    }));
    res.json(orders);
  });
});

// Customer-safe order tracking by phone number
app.get('/api/orders/track', (req, res) => {
  const phone = normalizePhone(req.query.phone);
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ error: 'Valid 10-digit phone is required' });
  }

  db.all(
    `SELECT id, orderId, items, total, paymentMethod, status, rating, review, createdAt
     FROM orders WHERE customerPhone = ? ORDER BY createdAt DESC`,
    [phone],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const orders = (rows || []).map((row) => ({
        ...row,
        items: safeParseItems(row.items),
      }));
      res.json(orders);
    }
  );
});

// Add new order
app.post('/api/orders', (req, res) => {
  const { orderId, customerName, customerPhone, address, items, total, paymentMethod, latitude, longitude, google_map_link } = req.body;
  db.run(
    'INSERT INTO orders (orderId, customerName, customerPhone, address, items, total, paymentMethod, latitude, longitude, google_map_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [orderId, customerName, customerPhone, address, JSON.stringify(items), total, paymentMethod, latitude || null, longitude || null, google_map_link || ''],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, success: true });
    }
  );
});

// Update order status
app.put('/api/orders/:id/status', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Delete order
app.delete('/api/orders/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Submit order rating
app.post('/api/orders/:orderId/rating', (req, res) => {
  const { orderId } = req.params;
  const { rating, review, customerPhone } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }
  db.run('UPDATE orders SET rating = ?, review = ? WHERE orderId = ?', [rating, review || '', orderId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    db.run('INSERT INTO ratings (orderId, rating, review, customerPhone) VALUES (?, ?, ?, ?)',
      [orderId, rating, review || '', customerPhone || ''], function(err2) {
        if (err2) console.error('Rating insert error:', err2);
        res.json({ success: true });
      });
  });
});

// Get order statistics
app.get('/api/stats', requireAdminAuth, (req, res) => {
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END) as totalEarnings,
      SUM(CASE WHEN date(createdAt) = date('now') AND status = 'completed' THEN total ELSE 0 END) as todayEarnings
    FROM orders
  `, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// ========== RESTAURANT ROUTES (Admin manages frontend data) ==========

// Get all restaurants with their menu items (including unavailable - frontend handles display)
app.get('/api/restaurants', (req, res) => {
  db.all('SELECT * FROM restaurants WHERE active = 1 ORDER BY name', (err, restaurants) => {
    if (err) return res.status(500).json({ error: err.message });
    db.all('SELECT * FROM menu_items ORDER BY category, name', (err2, items) => {
      if (err2) return res.status(500).json({ error: err2.message });
      // Pre-group items by restaurantId (O(I) instead of O(R×I))
      const itemsByRestaurant = {};
      for (const item of items) {
        if (!itemsByRestaurant[item.restaurantId]) {
          itemsByRestaurant[item.restaurantId] = [];
        }
        itemsByRestaurant[item.restaurantId].push({
          ...item,
          popular: !!item.popular,
          isVeg: item.isVeg !== 0,
          isAvailable: item.available !== 0,
        });
      }
      const result = restaurants.map(r => ({
        ...r,
        featured: !!r.featured,
        menu: itemsByRestaurant[r.id] || [],
      }));
      res.json(result);
    });
  });
});

// Add new restaurant
app.post('/api/restaurants', requireAdminAuth, (req, res) => {
  const { id, name, image, cuisine, rating, deliveryTime, minOrder, featured } = req.body;
  const restaurantId = id || `rest_${Date.now()}`;
  db.run(
    'INSERT INTO restaurants (id, name, image, cuisine, rating, deliveryTime, minOrder, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [restaurantId, name, image || '', cuisine || '', rating || 4.0, deliveryTime || '30-40 min', minOrder || 50, featured ? 1 : 0],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: restaurantId });
    }
  );
});

// Update restaurant
app.put('/api/restaurants/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { name, image, cuisine, rating, deliveryTime, minOrder, featured, active } = req.body;
  db.run(
    'UPDATE restaurants SET name = ?, image = ?, cuisine = ?, rating = ?, deliveryTime = ?, minOrder = ?, featured = ?, active = ? WHERE id = ?',
    [name, image, cuisine, rating, deliveryTime, minOrder, featured ? 1 : 0, active !== undefined ? (active ? 1 : 0) : 1, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Delete restaurant
app.delete('/api/restaurants/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  db.run('UPDATE restaurants SET active = 0 WHERE id = ?', [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ========== MENU ITEM ROUTES ==========

// Get all menu items (admin view - includes unavailable)
app.get('/api/menu-items', requireAdminAuth, (req, res) => {
  const { restaurantId } = req.query;
  let query = 'SELECT mi.*, r.name as restaurantName FROM menu_items mi JOIN restaurants r ON mi.restaurantId = r.id';
  const params = [];
  if (restaurantId) {
    query += ' WHERE mi.restaurantId = ?';
    params.push(restaurantId);
  }
  query += ' ORDER BY mi.restaurantId, mi.category, mi.name';
  db.all(query, params, (err, items) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(items.map(item => ({
      ...item,
      isVeg: item.isVeg !== 0,
      isAvailable: item.available !== 0,
    })));
  });
});

// Get ALL food items across all restaurants (customer view - includes unavailable for display)
app.get('/api/all-items', (req, res) => {
  db.all(`
    SELECT mi.*, r.name as restaurantName 
    FROM menu_items mi 
    JOIN restaurants r ON mi.restaurantId = r.id 
    WHERE r.active = 1
    ORDER BY mi.category, mi.name
  `, (err, items) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(items.map(item => ({
      ...item,
      popular: !!item.popular,
      isVeg: item.isVeg !== 0,
      isAvailable: item.available !== 0,
    })));
  });
});

// Add new menu item
app.post('/api/menu-items', requireAdminAuth, (req, res) => {
  const { restaurantId, name, price, category, description, popular, image, isVeg } = req.body;
  if (!restaurantId || !name || !price) {
    return res.status(400).json({ error: 'restaurantId, name, and price are required' });
  }
  const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  db.run(
    'INSERT INTO menu_items (id, restaurantId, name, price, category, description, popular, image, isVeg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [itemId, restaurantId, name, price, category || 'other', description || '', popular ? 1 : 0, image || '', isVeg !== undefined ? (isVeg ? 1 : 0) : 1],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: itemId });
    }
  );
});

// Update menu item
app.put('/api/menu-items/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { name, price, category, description, popular, image, available, isVeg } = req.body;
  db.run(
    'UPDATE menu_items SET name = ?, price = ?, category = ?, description = ?, popular = ?, image = ?, available = ?, isVeg = ? WHERE id = ?',
    [name, price, category, description, popular ? 1 : 0, image || '', available !== undefined ? (available ? 1 : 0) : 1, isVeg !== undefined ? (isVeg ? 1 : 0) : 1, id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Delete menu item
app.delete('/api/menu-items/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM menu_items WHERE id = ?', id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// ========== ANALYTICS ==========
app.get('/api/admin/analytics', requireAdminAuth, (req, res) => {
  const analytics = {};

  db.get(`
    SELECT 
      COUNT(*) as totalOrders,
      COALESCE(SUM(total), 0) as totalRevenue,
      COALESCE(AVG(total), 0) as avgOrderValue,
      SUM(CASE WHEN date(createdAt) = date('now') THEN 1 ELSE 0 END) as todayOrders,
      SUM(CASE WHEN status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as pendingOrders,
      SUM(CASE WHEN date(createdAt) = date('now') AND status = 'completed' THEN total ELSE 0 END) as todayRevenue,
      COALESCE(AVG(CASE WHEN rating > 0 THEN rating END), 0) as avgRating
    FROM orders
  `, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    analytics.summary = row;

    // Orders per day (last 7 days)
    db.all(`
      SELECT date(createdAt) as date, COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE createdAt >= datetime('now', '-7 days')
      GROUP BY date(createdAt)
      ORDER BY date DESC
    `, (err2, dailyStats) => {
      if (err2) return res.status(500).json({ error: err2.message });
      analytics.dailyStats = dailyStats || [];

      // Top selling items
      db.all(`
        SELECT items FROM orders WHERE status = 'completed'
      `, (err3, rows) => {
        if (err3) return res.status(500).json({ error: err3.message });
        const itemCounts = {};
        (rows || []).forEach(row => {
          try {
            const items = JSON.parse(row.items || '[]');
            items.forEach(item => {
              const key = item.name;
              if (key) {
                itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 1);
              }
            });
          } catch(e) {}
        });
        analytics.topItems = Object.entries(itemCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Recent ratings
        db.all('SELECT * FROM ratings ORDER BY createdAt DESC LIMIT 10', (err4, ratings) => {
          analytics.recentRatings = ratings || [];
          res.json(analytics);
        });
      });
    });
  });
});

// ========== SERVE REACT BUILD (production) ==========
// Must come AFTER all /api/* routes so API endpoints take priority.
app.use(express.static(path.join(__dirname, '..', 'build')));

// SPA fallback — return index.html for any non-API route so React Router works.
// Uses a regex because Express 5 no longer accepts bare '*' as a route pattern.
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  if (isProduction) {
    console.log(`🌐 Serving React build from: ${path.join(__dirname, '..', 'build')}`);
  }
  console.log(`📱 Access from other devices using: http://YOUR_IP_ADDRESS:${PORT}`);
});
