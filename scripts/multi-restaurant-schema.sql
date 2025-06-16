-- Add restaurants table for multi-tenant support
CREATE TABLE IF NOT EXISTS restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  primary_color VARCHAR(7) DEFAULT '#0f2b5b',
  secondary_color VARCHAR(7) DEFAULT '#ffffff',
  description TEXT,
  phone VARCHAR(20),
  address TEXT,
  logo_url VARCHAR(255),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add QR codes table
CREATE TABLE IF NOT EXISTS qr_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  qr_type ENUM('menu', 'takeout', 'delivery', 'custom') DEFAULT 'menu',
  scan_count INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);

-- Update existing tables to support multi-restaurant
ALTER TABLE menu_items ADD COLUMN restaurant_id INT;
ALTER TABLE menu_items ADD FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

ALTER TABLE orders ADD COLUMN restaurant_id INT;
ALTER TABLE orders ADD FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

ALTER TABLE inventory_items ADD COLUMN restaurant_id INT;
ALTER TABLE inventory_items ADD FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

-- Insert sample restaurant configurations
INSERT INTO restaurants (name, slug, primary_color, secondary_color, description, phone, address) VALUES
('Bistro Milano', 'bistro-milano', '#0f2b5b', '#ffffff', 'Authentic Italian cuisine in the heart of the city', '+1 (555) 123-4567', '123 Main St, Downtown'),
('Sakura Sushi', 'sakura-sushi', '#dc2626', '#ffffff', 'Fresh sushi and Japanese delicacies', '+1 (555) 987-6543', '456 Oak Ave, Midtown'),
('Green Garden Cafe', 'green-garden-cafe', '#16a34a', '#ffffff', 'Organic and healthy food options', '+1 (555) 456-7890', '789 Pine St, Uptown');

-- Create indexes
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_qr_codes_restaurant ON qr_codes(restaurant_id);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
