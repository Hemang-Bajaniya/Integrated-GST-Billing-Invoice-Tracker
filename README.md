# 🧾 Integrated GST & Billing Invoice Tracker

A web-based **ERP module for Small and Medium Enterprises (SMEs)** that automates **GST-compliant billing, invoice generation, payment tracking, and reporting**.  
The system digitizes the complete billing lifecycle with a secure, scalable, and role-based architecture.

---

## 📌 Project Overview

The **Integrated GST & Billing Invoice Tracker** helps SMEs manage:
- Customer and master data
- GST-compliant invoices
- Invoice payment status (Paid / Overdue)
- GST summaries and business reports

It is designed as a **lightweight ERP alternative** using modern web technologies.

---

## 🏗️ System Architecture

The application follows a **layered clean architecture** to ensure scalability, maintainability, and separation of concerns.

### 🔹 Architecture Diagram

```mermaid
flowchart TB
    subgraph Frontend["Presentation Layer"]
        UI["React.js Web App<br/>Login • Invoice • Dashboard"]
    end

    subgraph API["Application Layer"]
        Auth["Auth Controller<br/>JWT + RBAC"]
        InvoiceCtrl["Invoice Controller"]
        MasterCtrl["Master Data Controller"]
        ReportCtrl["Report Controller"]
    end

    subgraph Services["Business Logic Layer"]
        UserSvc["User & Role Service"]
        InvoiceSvc["Invoice Service"]
        GstSvc["GST Calculation Engine"]
        ReportSvc["Reporting Service"]
    end

    subgraph Data["Data Access Layer"]
        Repo["EF Core Repositories"]
        DbCtx["DbContext"]
    end

    subgraph DB["Database Layer"]
        MySQL["MySQL Database"]
    end

    UI -->|REST APIs| Auth
    UI -->|REST APIs| InvoiceCtrl
    UI -->|REST APIs| MasterCtrl
    UI -->|REST APIs| ReportCtrl

    Auth --> UserSvc
    InvoiceCtrl --> InvoiceSvc
    InvoiceSvc --> GstSvc
    MasterCtrl --> UserSvc
    ReportCtrl --> ReportSvc

    UserSvc --> Repo
    InvoiceSvc --> Repo
    ReportSvc --> Repo

    Repo --> DbCtx
    DbCtx --> MySQL
