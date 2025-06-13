-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS restaurant_manager;
USE restaurant_manager;

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'manager', 'staff') NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  reorder_level DECIMAL(10, 2),
  cost_per_unit DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  customer VARCHAR(100),
  table_number VARCHAR(10),
  order_type ENUM('dine-in', 'takeout', 'delivery') NOT NULL,
  status ENUM('pending', 'in-progress', 'ready', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Insert sample data
INSERT INTO users (username, password, name, role) VALUES
('admin', '$2b$10$rTgLKakFbE9AZ3hWkTOqvOKnUZjZeUGZMUYcq9XfmOA5JWvvDmQOi', 'Admin User', 'admin'),
('manager', '$2b$10$rTgLKakFbE9AZ3hWkTOqvOKnUZjZeUGZMUYcq9XfmOA5JWvvDmQOi', 'Restaurant Manager', 'manager');

INSERT INTO menu_categories (name, description) VALUES
('Appetizers', 'Start your meal with these delicious options'),
('Main Courses', 'Hearty and satisfying dishes'),
('Desserts', 'Sweet treats to end your meal'),
('Beverages', 'Refreshing drinks');

-- Add more sample data as needed
