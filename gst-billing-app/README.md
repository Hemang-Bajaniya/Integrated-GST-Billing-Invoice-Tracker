# GST Billing System - React Vite App

A modern React application for managing GST billing, customers, products, and invoices.

## Features

- **Dashboard**: Overview of the billing system
- **Customer Management**: Add, edit, and delete customers with validation
- **Product Management**: Manage products with pricing and GST rates
- **Invoice Generation**: Create invoices with automatic GST calculations (CGST & SGST)

## Folder Structure

```
gst-billing-app/
├── src/
│   ├── components/         # Reusable React components
│   │   ├── Navbar.jsx
│   │   ├── Footer.jsx
│   │   ├── CustomerForm.jsx
│   │   ├── CustomerTable.jsx
│   │   ├── ProductForm.jsx
│   │   ├── ProductTable.jsx
│   │   └── InvoiceForm.jsx
│   ├── pages/             # Page components (routes)
│   │   ├── Dashboard.jsx
│   │   ├── Customers.jsx
│   │   ├── Products.jsx
│   │   └── Invoices.jsx
│   ├── services/          # API service layer
│   │   └── api.js
│   ├── App.jsx            # Main app component with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
└── package.json           # Dependencies

```

## Tech Stack

- **React 18**: UI library
- **React Router DOM**: Client-side routing
- **Vite**: Build tool and dev server
- **Bootstrap 5**: UI framework
- **Native Fetch API**: HTTP requests

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Configuration

The app is configured to proxy API requests to `http://localhost:3000` via the Vite dev server. Update `vite.config.js` if your backend runs on a different port.

## API Endpoints

The app expects the following REST API endpoints:

- **Customers**
  - GET /api/customers
  - POST /api/customers
  - PUT /api/customers/:id
  - DELETE /api/customers/:id

- **Products**
  - GET /api/products
  - POST /api/products
  - PUT /api/products/:id
  - DELETE /api/products/:id

- **Invoices**
  - GET /api/invoices
  - POST /api/invoices

## Components

### Pages
- `Dashboard`: Home page with system overview
- `Customers`: Customer CRUD operations with form validation
- `Products`: Product management with GST rates
- `Invoices`: Invoice creation with automatic calculations

### Components
- `Navbar`: Top navigation with active route highlighting
- `Footer`: Footer with copyright info
- `CustomerForm`: Form for adding/editing customers with validation
- `CustomerTable`: Table displaying customer list
- `ProductForm`: Form for adding/editing products
- `ProductTable`: Table displaying product list
- `InvoiceForm`: Complex form for invoice generation with line items

## Features Implementation

### Customer Management
- Form validation (name, email, phone, address)
- Add/Edit/Delete operations
- Phone number validation (10 digits)

### Product Management
- Product name, unit price, and GST rate
- GST options: 5%, 12%, 18%, 28%

### Invoice Generation
- Select customer and date
- Add multiple line items
- Automatic calculation of:
  - Subtotal
  - CGST (half of GST)
  - SGST (half of GST)
  - Grand Total

## Validation

The app includes HTML5 form validation with Bootstrap styling for:
- Required fields
- Email format
- Phone number pattern (10 digits)
- Minimum length constraints

## Browser Support

Modern browsers supporting ES6+ features.
