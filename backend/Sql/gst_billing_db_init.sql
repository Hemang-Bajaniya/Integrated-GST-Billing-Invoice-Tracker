-- =====================================================
-- GST INVOICE TRACKER - DATABASE SCHEMA (MySQL Version)
-- =====================================================

-- Set character set and collation for proper international support
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- =====================================================
-- NOTE ON ENUMS IN MYSQL
-- MySQL ENUMs are defined inline in column definitions
-- rather than as separate types like PostgreSQL
-- =====================================================

-- =====================================================
-- AUTH USERS TABLE (Replaces PostgreSQL's auth.users schema)
-- =====================================================
-- In PostgreSQL/Supabase, auth.users is in a separate schema
-- In MySQL, we create it as a regular table

CREATE TABLE IF NOT EXISTS auth_users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  encrypted_password VARCHAR(255),
  email_confirmed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_auth_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLES
-- =====================================================

-- Business Profile table (company details for invoices)
CREATE TABLE business_profiles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state ENUM(
    'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DD', 'DL', 'GA',
    'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH',
    'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK',
    'TN', 'TS', 'TR', 'UK', 'UP', 'WB'
  ) COMMENT 'Indian states for GST',
  pincode TEXT,
  phone TEXT,
  email TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  invoice_prefix VARCHAR(50) DEFAULT 'INV',
  invoice_counter INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_business_profiles_name (name(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Profiles table (user profiles linked to auth_users)
CREATE TABLE profiles (
  id CHAR(36) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role ENUM('admin', 'accountant', 'viewer') NOT NULL DEFAULT 'viewer' COMMENT 'Application role',
  business_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES auth_users(id) ON DELETE CASCADE,
  FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE SET NULL,
  INDEX idx_profiles_business_id (business_id),
  INDEX idx_profiles_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User roles table (for complex role management)
CREATE TABLE user_roles (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id CHAR(36) NOT NULL,
  role ENUM('admin', 'accountant', 'viewer') NOT NULL COMMENT 'Application role',
  UNIQUE KEY unique_user_role (user_id, role),
  FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
  INDEX idx_user_roles_user_id (user_id),
  INDEX idx_user_roles_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers table
CREATE TABLE customers (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id CHAR(36) NOT NULL,
  name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state ENUM(
    'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DD', 'DL', 'GA',
    'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH',
    'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK',
    'TN', 'TS', 'TR', 'UK', 'UP', 'WB'
  ) COMMENT 'Indian states for GST',
  pincode TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE,
  INDEX idx_customers_business_id (business_id),
  INDEX idx_customers_name (name(255)),
  INDEX idx_customers_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vendors table
CREATE TABLE vendors (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id CHAR(36) NOT NULL,
  name TEXT NOT NULL,
  gstin TEXT,
  pan TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state ENUM(
    'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DD', 'DL', 'GA',
    'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH',
    'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK',
    'TN', 'TS', 'TR', 'UK', 'UP', 'WB'
  ) COMMENT 'Indian states for GST',
  pincode TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE,
  INDEX idx_vendors_business_id (business_id),
  INDEX idx_vendors_name (name(255)),
  INDEX idx_vendors_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gst rate table
-- As rate are changes
CREATE TABLE gst_rates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    rate DECIMAL(5,2) NOT NULL,
    effective_from DATE NULL,
    effective_to DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products table
CREATE TABLE products (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id CHAR(36) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  hsn_sac_code TEXT,
  unit VARCHAR(20) DEFAULT 'NOS',
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst_rate_id CHAR(36) NOT NULL,
  is_service BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (gst_rate_id) REFERENCES gst_rates(id) ON DELETE CASCADE,
  INDEX idx_products_business_id (business_id),
  INDEX idx_products_name (name(255)),
  INDEX idx_products_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices table
CREATE TABLE invoices (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_id CHAR(36) NOT NULL,
  customer_id CHAR(36) NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  invoice_type ENUM('tax_invoice', 'bill_of_supply', 'credit_note', 'debit_note') NOT NULL DEFAULT 'tax_invoice' COMMENT 'Type of invoice',
  invoice_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  due_date DATE,
  place_of_supply ENUM(
    'AN', 'AP', 'AR', 'AS', 'BR', 'CH', 'CT', 'DD', 'DL', 'GA',
    'GJ', 'HP', 'HR', 'JH', 'JK', 'KA', 'KL', 'LA', 'LD', 'MH',
    'ML', 'MN', 'MP', 'MZ', 'NL', 'OD', 'PB', 'PY', 'RJ', 'SK',
    'TN', 'TS', 'TR', 'UK', 'UP', 'WB'
  ) COMMENT 'Indian states for GST',
  is_inter_state BOOLEAN DEFAULT FALSE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  total_tax DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  status ENUM('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled') DEFAULT 'draft' COMMENT 'Invoice status',
  notes TEXT,
  terms TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES auth_users(id),
  CONSTRAINT unique_invoice_per_business UNIQUE (business_id, invoice_number),
  INDEX idx_invoices_business_id (business_id),
  INDEX idx_invoices_customer_id (customer_id),
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_invoice_date (invoice_date),
  INDEX idx_invoices_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice items table
CREATE TABLE invoice_items (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_id CHAR(36) NOT NULL,
  product_id CHAR(36),
  description TEXT NOT NULL,
  hsn_sac_code TEXT,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit VARCHAR(20) DEFAULT 'NOS',
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  taxable_amount DECIMAL(12,2) DEFAULT 0,
    gst_rate_id CHAR(36) NOT NULL,
  cgst_amount DECIMAL(12,2) DEFAULT 0,
  sgst_amount DECIMAL(12,2) DEFAULT 0,
  igst_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  FOREIGN KEY (gst_rate_id) REFERENCES gst_rates(id) ON DELETE CASCADE,
  INDEX idx_invoice_items_invoice_id (invoice_id),
  INDEX idx_invoice_items_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Payment records table
CREATE TABLE payments (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  invoice_id CHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  payment_method ENUM('cash','bank','upi','card','cheque'),
  status ENUM('Pending','Completed','Failed') DEFAULT 'Pending',
  reference_number TEXT,
  notes TEXT,
  created_by CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES auth_users(id),
  INDEX idx_payments_invoice_id (invoice_id),
  INDEX idx_payments_payment_date (payment_date),
  INDEX idx_payments_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit log table
CREATE TABLE audit_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    entity_name VARCHAR(100),
    entity_id CHAR(36),
    action VARCHAR(50),
    old_value JSON,
    new_value JSON,
    user_id CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Enterprise Tax Breakdown Table
CREATE TABLE invoice_item_taxes (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    invoice_item_id CHAR(36),
    tax_type ENUM('CGST','SGST','IGST'),
    tax_rate DECIMAL(5,2),
    tax_amount DECIMAL(14,2),

    CONSTRAINT fk_invoice_item_tax
    FOREIGN KEY (invoice_item_id)
    REFERENCES invoice_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dashboard Performance Index
CREATE INDEX idx_invoice_business_date
ON invoices(business_id, invoice_date);


-- ✅ done
=====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Note: MySQL doesn't have a built-in auth.uid() function like Supabase
-- These functions assume you're passing the user_id as a parameter
-- or you can use MySQL user variables or session variables

DELIMITER //

-- Get user's business ID
-- In MySQL, we need to pass user_id as parameter since there's no auth.uid()
CREATE FUNCTION get_user_business_id(user_id CHAR(36))
RETURNS CHAR(36)
READS SQL DATA
DETERMINISTIC
SQL SECURITY DEFINER
BEGIN
  DECLARE business_id_val CHAR(36);
  
  SELECT business_id INTO business_id_val
  FROM profiles
  WHERE id = user_id
  LIMIT 1;
  
  RETURN business_id_val;
END//

-- Get user's role
CREATE FUNCTION get_user_role(user_id CHAR(36))
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
SQL SECURITY DEFINER
BEGIN
  DECLARE role_val VARCHAR(20);
  
  SELECT role INTO role_val
  FROM profiles
  WHERE id = user_id
  LIMIT 1;
  
  RETURN role_val;
END//

-- Check if user has specific role
CREATE FUNCTION has_role(_user_id CHAR(36), _role VARCHAR(20))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
SQL SECURITY DEFINER
BEGIN
  DECLARE has_role_val BOOLEAN;
  
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  ) INTO has_role_val;
  
  RETURN has_role_val;
END//

-- Check if user can modify data (admin or accountant)
CREATE FUNCTION can_modify_data(user_id CHAR(36))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
SQL SECURITY DEFINER
BEGIN
  DECLARE can_modify BOOLEAN;
  
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role IN ('admin', 'accountant')
  ) INTO can_modify;
  
  RETURN can_modify;
END//

-- Check if user is admin
CREATE FUNCTION is_admin(user_id CHAR(36))
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
SQL SECURITY DEFINER
BEGIN
  DECLARE is_admin_val BOOLEAN;
  
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  ) INTO is_admin_val;
  
  RETURN is_admin_val;
END//

DELIMITER ;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) EQUIVALENT
-- =====================================================

-- NOTE: MySQL does not have native Row Level Security like PostgreSQL
-- RLS must be implemented at the application level or through:
-- 1. Views with WHERE clauses that filter by user
-- 2. Stored procedures that enforce access control
-- 3. Application-level middleware
-- 4. Triggers (limited use case)
--
-- The PostgreSQL policies are documented below as comments for reference
-- and should be implemented in your application layer:

-- =====================================================
-- RLS POLICIES (To be implemented in application layer)
-- =====================================================

-- Business Profiles policies:
-- - Users can SELECT their own business profile (WHERE id = get_user_business_id())
-- - Admins can UPDATE their business profile (WHERE id = get_user_business_id() AND is_admin())
-- - Admins can INSERT business profile (WHERE is_admin() OR no existing business_id)

-- Profiles policies:
-- - Users can SELECT profiles in their business (WHERE business_id = get_user_business_id() OR id = user_id)
-- - Users can UPDATE their own profile (WHERE id = user_id)
-- - New users can INSERT their profile (WHERE id = user_id)

-- User roles policies:
-- - Users can SELECT roles in their business (WHERE user_id IN (SELECT id FROM profiles WHERE business_id = get_user_business_id()))
-- - Admins can manage (INSERT/UPDATE/DELETE) all roles (WHERE is_admin())

-- Customers policies:
-- - Users can SELECT customers in their business (WHERE business_id = get_user_business_id())
-- - Admin and accountant can INSERT customers (WHERE business_id = get_user_business_id() AND can_modify_data())
-- - Admin and accountant can UPDATE customers (WHERE business_id = get_user_business_id() AND can_modify_data())
-- - Admin can DELETE customers (WHERE business_id = get_user_business_id() AND is_admin())

-- Vendors policies:
-- - Users can SELECT vendors in their business (WHERE business_id = get_user_business_id())
-- - Admin and accountant can INSERT vendors (WHERE business_id = get_user_business_id() AND can_modify_data())
-- - Admin and accountant can UPDATE vendors (WHERE business_id = get_user_business_id() AND can_modify_data())
-- - Admin can DELETE vendors (WHERE business_id = get_user_business_id() AND is_admin())

-- Products policies:
-- - Users can SELECT products in their business (WHERE business_id = get_user_business_id())
-- - Admin and accountant can INSERT products (WHERE business_id = get_user_business_id() AND can_modify_data())
-- - Admin and accountant can UPDATE products (WHERE business_id = get_user_business_id() AND can_modify_data())
-- - Admin can DELETE products (WHERE business_id = get_user_business_id() AND is_admin())

-- Invoices policies:
-- - Users can SELECT invoices in their business (WHERE business_id = get_user_business_id())
-- - Admin and accountant can INSERT invoices (WHERE business_id = get_user_business_id() AND can_modify_data())
-- - Admin and accountant can UPDATE invoices (WHERE business_id = get_user_business_id() AND can_modify_data())
-- - Admin can DELETE invoices (WHERE business_id = get_user_business_id() AND is_admin())

-- Invoice items policies:
-- - Users can SELECT invoice items for their invoices (WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id()))
-- - Admin and accountant can INSERT invoice items (WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id()) AND can_modify_data())
-- - Admin and accountant can UPDATE invoice items (WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id()) AND can_modify_data())
-- - Admin can DELETE invoice items (WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id()) AND is_admin())

-- Payments policies:
-- - Users can SELECT payments for their invoices (WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id()))
-- - Admin and accountant can INSERT payments (WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id()) AND can_modify_data())
-- - Admin and accountant can UPDATE payments (WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id()) AND can_modify_data())
-- - Admin can DELETE payments (WHERE invoice_id IN (SELECT id FROM invoices WHERE business_id = get_user_business_id()) AND is_admin())

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Note: MySQL has ON UPDATE CURRENT_TIMESTAMP built-in for TIMESTAMP columns
-- which handles the updated_at automatically. The following triggers are
-- provided for tables that don't use this feature or need custom logic.

DELIMITER //

-- Updated at trigger function (for tables without ON UPDATE CURRENT_TIMESTAMP)
-- This is included for completeness, but most tables use ON UPDATE CURRENT_TIMESTAMP

-- Trigger for business_profiles
-- (Not needed as table uses ON UPDATE CURRENT_TIMESTAMP, included for reference)
CREATE TRIGGER update_business_profiles_updated_at
  BEFORE UPDATE ON business_profiles
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

-- Trigger for profiles
-- (Not needed as table uses ON UPDATE CURRENT_TIMESTAMP, included for reference)
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

-- Trigger for customers
-- (Not needed as table uses ON UPDATE CURRENT_TIMESTAMP, included for reference)
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

-- Trigger for vendors
-- (Not needed as table uses ON UPDATE CURRENT_TIMESTAMP, included for reference)
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

-- Trigger for products
-- (Not needed as table uses ON UPDATE CURRENT_TIMESTAMP, included for reference)
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

-- Trigger for invoices
-- (Not needed as table uses ON UPDATE CURRENT_TIMESTAMP, included for reference)
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END//

DELIMITER ;

-- =====================================================
-- PROFILE CREATION TRIGGER
-- =====================================================

DELIMITER //

-- Automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth_users
  FOR EACH ROW
BEGIN
  DECLARE user_full_name TEXT;
  
  -- Extract full_name from JSON metadata if exists
  -- MySQL JSON functions: JSON_EXTRACT, JSON_UNQUOTE
  SET user_full_name = COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(NEW.raw_user_meta_data, '$.full_name')),
    ''
  );
  
  -- Insert into profiles table
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    'admin'
  );
  
  -- Also add to user_roles table
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
END//

DELIMITER ;

-- =====================================================
-- EXAMPLE SECURE VIEWS (Optional RLS Implementation)
-- =====================================================

-- Example: Create a view for users to access only their business customers
-- This can be used in application layer to enforce RLS-like behavior

DELIMITER //

-- You can create views like this and use them in your application
-- Pass user_id as a parameter through WHERE clause or session variable

-- Example view for customers (requires session variable @current_user_id)
CREATE OR REPLACE VIEW user_customers AS
SELECT c.*
FROM customers c
INNER JOIN profiles p ON c.business_id = p.business_id
WHERE p.id = @current_user_id;

-- Example view for invoices (requires session variable @current_user_id)
CREATE OR REPLACE VIEW user_invoices AS
SELECT i.*
FROM invoices i
INNER JOIN profiles p ON i.business_id = p.business_id
WHERE p.id = @current_user_id;

DELIMITER ;

-- =====================================================
-- USAGE NOTES
-- =====================================================

-- To use the helper functions, you need to pass the user_id:
-- Example: SELECT get_user_business_id('user-uuid-here');
-- Example: SELECT can_modify_data('user-uuid-here');

-- To use views with session variables:
-- SET @current_user_id = 'user-uuid-here';
-- SELECT * FROM user_customers;

-- For RLS implementation in application:
-- Always include WHERE clauses that check:
-- 1. business_id matches user's business
-- 2. user role has required permissions (using helper functions)

-- =====================================================
-- END OF SCHEMA
-- =====================================================

ALTER TABLE auth_users
ADD COLUMN business_profile_id CHAR(36) NULL;

ALTER TABLE auth_users
ADD CONSTRAINT fk_authuser_business
FOREIGN KEY (business_profile_id)
REFERENCES business_profiles(id);

