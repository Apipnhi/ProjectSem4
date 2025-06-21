-- Updated database schema for Restomate
CREATE DATABASE IF NOT EXISTS restomate;
USE restomate;

-- Users table (for admin/staff authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menu categories
CREATE TABLE IF NOT EXISTS menu_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  rating DECIMAL(2, 1) DEFAULT 0,
  prep_time VARCHAR(20),
  is_popular BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
);

-- Food packs
CREATE TABLE IF NOT EXISTS food_packs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  pack_type ENUM('Pack 1', 'Pack 2', 'Pack 3') NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  image_url VARCHAR(255),
  rating DECIMAL(2, 1) DEFAULT 0,
  prep_time VARCHAR(20),
  is_popular BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Food pack items (junction table)
CREATE TABLE IF NOT EXISTS food_pack_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pack_id INT NOT NULL,
  menu_item_id INT NOT NULL,
  quantity INT DEFAULT 1,
  FOREIGN KEY (pack_id) REFERENCES food_packs(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Customer information
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer_id INT,
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  table_number VARCHAR(10),
  order_type ENUM('dine-in', 'takeout', 'delivery') NOT NULL,
  status ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'digital') DEFAULT 'cash',
  payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
  delivery_address TEXT,
  special_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  item_type ENUM('menu_item', 'food_pack') NOT NULL,
  item_id INT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  special_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(50) NOT NULL UNIQUE,
  order_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'card', 'digital') NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Sales reports (for caching AI predictions)
CREATE TABLE IF NOT EXISTS sales_predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  period_type ENUM('daily', 'monthly', 'yearly') NOT NULL,
  prediction_type ENUM('next_day', 'next_month', 'next_year') NOT NULL,
  predicted_sales DECIMAL(12, 2) NOT NULL,
  confidence_percentage INT NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Insert sample data
INSERT INTO users (username, password, name, email, role) VALUES
('admin', '$2b$10$rTgLKakFbE9AZ3hWkTOqvOKnUZjZeUGZMUYcq9XfmOA5JWvvDmQOi', 'Admin User', 'admin@restomate.com', 'admin'),
('manager', '$2b$10$rTgLKakFbE9AZ3hWkTOqvOKnUZjZeUGZMUYcq9XfmOA5JWvvDmQOi', 'John Doe', 'manager@restomate.com', 'manager'),
('demo_customer', '$2b$10$rTgLKakFbE9AZ3hWkTOqvOKnUZjZeUGZMUYcq9XfmOA5JWvvDmQOi', 'Demo Customer', 'customer@restomate.com', 'staff');

INSERT INTO menu_categories (name, description) VALUES
('Main Course', 'Hearty and satisfying main dishes'),
('Appetizer', 'Perfect starters to begin your meal'),
('Salad', 'Fresh and healthy salad options'),
('Dessert', 'Sweet treats to end your meal'),
('Beverage', 'Refreshing drinks and beverages');

INSERT INTO menu_items (category_id, name, description, price, image_url, rating, prep_time, is_popular) VALUES
(1, 'Grilled Salmon', 'Fresh Atlantic salmon grilled to perfection with herbs and lemon', 24.99, '/placeholder.svg?height=200&width=200', 4.8, '15-20 min', TRUE),
(3, 'Caesar Salad', 'Crisp romaine lettuce with parmesan cheese, croutons, and Caesar dressing', 12.99, '/placeholder.svg?height=200&width=200', 4.6, '5-10 min', FALSE),
(1, 'Margherita Pizza', 'Classic pizza with fresh mozzarella, tomatoes, and basil', 16.99, '/placeholder.svg?height=200&width=200', 4.7, '12-15 min', TRUE),
(4, 'Chocolate Cake', 'Rich chocolate cake with vanilla ice cream and berry compote', 8.99, '/placeholder.svg?height=200&width=200', 4.9, '5 min', FALSE),
(5, 'Coca Cola', 'Refreshing cola drink served chilled', 2.99, '/placeholder.svg?height=200&width=200', 4.5, '1 min', FALSE),
(2, 'Chicken Wings', 'Crispy chicken wings with your choice of sauce', 11.99, '/placeholder.svg?height=200&width=200', 4.4, '10-12 min', TRUE);

INSERT INTO food_packs (name, description, pack_type, price, original_price, image_url, rating, prep_time, is_popular) VALUES
('Lunch Special', 'Grilled Salmon + Coca Cola', 'Pack 1', 24.99, 27.98, '/placeholder.svg?height=200&width=200', 4.7, '15-20 min', TRUE),
('Family Pack', 'Margherita Pizza + Caesar Salad + Coca Cola', 'Pack 2', 28.99, 32.97, '/placeholder.svg?height=200&width=200', 4.6, '15-20 min', FALSE);

-- Insert sample customers
INSERT INTO customers (name, phone, email, address) VALUES
('Demo Customer', '+1-555-0123', 'demo@customer.com', '123 Demo Street, Demo City, DC 12345'),
('Jane Smith', '+1-555-0124', 'jane@example.com', '456 Example Ave, Sample Town, ST 67890');

-- Insert sample orders
INSERT INTO orders (order_number, customer_id, customer_name, customer_phone, table_number, order_type, status, total, payment_method, payment_status) VALUES
('ORD-001', 1, 'Demo Customer', '+1-555-0123', '5', 'dine-in', 'completed', 65.20, 'cash', 'paid'),
('ORD-002', 2, 'Jane Smith', '+1-555-0124', NULL, 'takeout', 'ready', 28.50, 'card', 'paid');
