# 📘 API Contracts Documentation
## Integrated GST & Billing Invoice Tracker

This document defines the **contract-driven REST APIs** for the Integrated GST & Billing Invoice Tracker project.
It enables parallel development between frontend and backend teams.

---

## 🌐 Base URL

/api/v1

---

## 🔐 Authentication

All secured APIs require a JWT token in the request header:

Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

---

## 🔁 Standard API Response Format

### ✅ Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "errors": []
}

### ❌ Error Response
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": ["Error description"]
}

---

## 🔐 AUTH MODULE

### 1️⃣ Login
**POST** `/auth/login`

**Request Body**
{
  "email": "admin@company.com",
  "password": "Admin@123"
}

**Response**
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_token_here",
    "expiresIn": 3600,
    "user": {
      "id": 1,
      "fullName": "Admin User",
      "email": "admin@company.com",
      "role": "Admin"
    }
  },
  "errors": []
}

**Error Codes**
* `401` – Invalid credentials
* `403` – User inactive

### 2️⃣ Get Logged-in User
**GET** `/auth/me`
🔒 **Requires JWT**

**Response**
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Admin User",
    "email": "admin@company.com",
    "role": "Admin"
  }
}

### 3️⃣ Logout (Optional)
**POST** `/auth/logout`

**Response**
{
  "success": true,
  "message": "Logged out successfully"
}

---

## 👤 USER MANAGEMENT (ADMIN)

### 4️⃣ Create User
**POST** `/users`
🔒 **Role: Admin**

**Request Body**
{
  "fullName": "John Accountant",
  "email": "john@company.com",
  "role": "Accountant"
}

**Response**
{
  "success": true,
  "message": "User created successfully"
}

### 5️⃣ List Users
**GET** `/users`
🔒 **Role: Admin**

**Response**
{
  "success": true,
  "data": [
    {
      "id": 2,
      "fullName": "John Accountant",
      "email": "john@company.com",
      "role": "Accountant",
      "isActive": true
    }
  ]
}

---

## 📊 DASHBOARD MODULE

### 6️⃣ Dashboard Summary
**GET** `/dashboard/summary`

**Response**
{
  "success": true,
  "data": {
    "totalInvoices": 120,
    "paidInvoices": 90,
    "overdueInvoices": 30,
    "totalRevenue": 1540000.50,
    "totalGSTCollected": 277200.00
  }
}

### 7️⃣ Monthly Revenue Chart
**GET** `/dashboard/monthly-revenue?year=2026`

**Response**
{
  "success": true,
  "data": [
    { "month": "Jan", "revenue": 120000 },
    { "month": "Feb", "revenue": 98000 },
    { "month": "Mar", "revenue": 145000 }
  ]
}

---

## 🧾 INVOICE MODULE (READ-ONLY – INITIAL PHASE)

### 8️⃣ Invoice List
**GET** `/invoices`

**Response**
{
  "success": true,
  "data": [
    {
      "invoiceId": 101,
      "invoiceNumber": "INV-2026-0001",
      "customerName": "ABC Pvt Ltd",
      "invoiceDate": "2026-01-10",
      "totalAmount": 45000,
      "status": "Paid"
    },
    {
      "invoiceId": 102,
      "invoiceNumber": "INV-2026-0002",
      "customerName": "XYZ Solutions",
      "invoiceDate": "2026-01-15",
      "totalAmount": 62000,
      "status": "Overdue"
    }
  ]
}

---

## 📌 API Security Rules
1.  **Rate Limiting:** Max 100 requests per minute per IP.
2.  **CORS Policy:** Only allowed from registered frontend domains.
3.  **Input Validation:** Strict type checking on all POST bodies.