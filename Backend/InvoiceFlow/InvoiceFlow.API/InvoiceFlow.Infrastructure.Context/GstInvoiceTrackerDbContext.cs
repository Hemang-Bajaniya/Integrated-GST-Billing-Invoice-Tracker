using System;
using System.Collections.Generic;
using InvoiceFlow.API.InvoiceFlow.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace InvoiceFlow.API.InvoiceFlow.Infrastructure.Context;

public partial class GstInvoiceTrackerDbContext : DbContext
{
    public GstInvoiceTrackerDbContext()
    {
    }

    public GstInvoiceTrackerDbContext(DbContextOptions<GstInvoiceTrackerDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<AuthUser> AuthUsers { get; set; }

    public virtual DbSet<BusinessProfile> BusinessProfiles { get; set; }

    public virtual DbSet<Customer> Customers { get; set; }

    public virtual DbSet<GstRate> GstRates { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<InvoiceItem> InvoiceItems { get; set; }

    public virtual DbSet<InvoiceItemTaxis> InvoiceItemTaxes { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Product> Products { get; set; }

    public virtual DbSet<Profile> Profiles { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }

    public virtual DbSet<Vendor> Vendors { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySql("server=localhost;port=3306;database=gst_invoice_tracker_db;uid=root;password=root", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.43-mysql"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("audit_logs")
                .UseCollation("utf8mb4_unicode_ci");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Action)
                .HasMaxLength(50)
                .HasColumnName("action");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.EntityId).HasColumnName("entity_id");
            entity.Property(e => e.EntityName)
                .HasMaxLength(100)
                .HasColumnName("entity_name");
            entity.Property(e => e.NewValue)
                .HasColumnType("json")
                .HasColumnName("new_value");
            entity.Property(e => e.OldValue)
                .HasColumnType("json")
                .HasColumnName("old_value");
            entity.Property(e => e.UserId).HasColumnName("user_id");
        });

        modelBuilder.Entity<AuthUser>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("auth_users")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Email, "email").IsUnique();

            entity.HasIndex(e => e.BusinessProfileId, "fk_authuser_business");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BusinessProfileId).HasColumnName("business_profile_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Email).HasColumnName("email");
            entity.Property(e => e.EmailConfirmedAt)
                .HasColumnType("timestamp")
                .HasColumnName("email_confirmed_at");
            entity.Property(e => e.EncryptedPassword)
                .HasMaxLength(255)
                .HasColumnName("encrypted_password");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.BusinessProfile).WithMany(p => p.AuthUsers)
                .HasForeignKey(d => d.BusinessProfileId)
                .HasConstraintName("fk_authuser_business");
        });

        modelBuilder.Entity<BusinessProfile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("business_profiles")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Name, "idx_business_profiles_name").HasAnnotation("MySql:IndexPrefixLength", new[] { 255 });

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AddressLine1)
                .HasColumnType("text")
                .HasColumnName("address_line1");
            entity.Property(e => e.AddressLine2)
                .HasColumnType("text")
                .HasColumnName("address_line2");
            entity.Property(e => e.BankAccountNumber)
                .HasColumnType("text")
                .HasColumnName("bank_account_number");
            entity.Property(e => e.BankIfsc)
                .HasColumnType("text")
                .HasColumnName("bank_ifsc");
            entity.Property(e => e.BankName)
                .HasColumnType("text")
                .HasColumnName("bank_name");
            entity.Property(e => e.City)
                .HasColumnType("text")
                .HasColumnName("city");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasColumnType("text")
                .HasColumnName("email");
            entity.Property(e => e.Gstin)
                .HasColumnType("text")
                .HasColumnName("gstin");
            entity.Property(e => e.InvoiceCounter)
                .HasDefaultValueSql("'1'")
                .HasColumnName("invoice_counter");
            entity.Property(e => e.InvoicePrefix)
                .HasMaxLength(50)
                .HasDefaultValueSql("'INV'")
                .HasColumnName("invoice_prefix");
            entity.Property(e => e.Name)
                .HasColumnType("text")
                .HasColumnName("name");
            entity.Property(e => e.Pan)
                .HasColumnType("text")
                .HasColumnName("pan");
            entity.Property(e => e.Phone)
                .HasColumnType("text")
                .HasColumnName("phone");
            entity.Property(e => e.Pincode)
                .HasColumnType("text")
                .HasColumnName("pincode");
            entity.Property(e => e.State)
                .HasComment("Indian states for GST")
                .HasColumnType("enum('AN','AP','AR','AS','BR','CH','CT','DD','DL','GA','GJ','HP','HR','JH','JK','KA','KL','LA','LD','MH','ML','MN','MP','MZ','NL','OD','PB','PY','RJ','SK','TN','TS','TR','UK','UP','WB')")
                .HasColumnName("state");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("customers")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.BusinessId, "idx_customers_business_id");

            entity.HasIndex(e => e.IsActive, "idx_customers_is_active");

            entity.HasIndex(e => e.Name, "idx_customers_name").HasAnnotation("MySql:IndexPrefixLength", new[] { 255 });

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AddressLine1)
                .HasColumnType("text")
                .HasColumnName("address_line1");
            entity.Property(e => e.AddressLine2)
                .HasColumnType("text")
                .HasColumnName("address_line2");
            entity.Property(e => e.BusinessId).HasColumnName("business_id");
            entity.Property(e => e.City)
                .HasColumnType("text")
                .HasColumnName("city");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasColumnType("text")
                .HasColumnName("email");
            entity.Property(e => e.Gstin)
                .HasColumnType("text")
                .HasColumnName("gstin");
            entity.Property(e => e.IsActive)
                .HasDefaultValueSql("'1'")
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasColumnType("text")
                .HasColumnName("name");
            entity.Property(e => e.Pan)
                .HasColumnType("text")
                .HasColumnName("pan");
            entity.Property(e => e.Phone)
                .HasColumnType("text")
                .HasColumnName("phone");
            entity.Property(e => e.Pincode)
                .HasColumnType("text")
                .HasColumnName("pincode");
            entity.Property(e => e.State)
                .HasComment("Indian states for GST")
                .HasColumnType("enum('AN','AP','AR','AS','BR','CH','CT','DD','DL','GA','GJ','HP','HR','JH','JK','KA','KL','LA','LD','MH','ML','MN','MP','MZ','NL','OD','PB','PY','RJ','SK','TN','TS','TR','UK','UP','WB')")
                .HasColumnName("state");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Business).WithMany(p => p.Customers)
                .HasForeignKey(d => d.BusinessId)
                .HasConstraintName("customers_ibfk_1");
        });

        modelBuilder.Entity<GstRate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("gst_rates")
                .UseCollation("utf8mb4_unicode_ci");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.EffectiveFrom).HasColumnName("effective_from");
            entity.Property(e => e.EffectiveTo).HasColumnName("effective_to");
            entity.Property(e => e.Rate)
                .HasPrecision(5, 2)
                .HasColumnName("rate");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("invoices")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => new { e.BusinessId, e.InvoiceDate }, "idx_invoice_business_date");

            entity.HasIndex(e => e.BusinessId, "idx_invoices_business_id");

            entity.HasIndex(e => e.CreatedBy, "idx_invoices_created_by");

            entity.HasIndex(e => e.CustomerId, "idx_invoices_customer_id");

            entity.HasIndex(e => e.InvoiceDate, "idx_invoices_invoice_date");

            entity.HasIndex(e => e.Status, "idx_invoices_status");

            entity.HasIndex(e => new { e.BusinessId, e.InvoiceNumber }, "unique_invoice_per_business").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AmountPaid)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("amount_paid");
            entity.Property(e => e.BusinessId).HasColumnName("business_id");
            entity.Property(e => e.CgstAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("cgst_amount");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.CustomerId).HasColumnName("customer_id");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.IgstAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("igst_amount");
            entity.Property(e => e.InvoiceDate)
                .HasDefaultValueSql("curdate()")
                .HasColumnName("invoice_date");
            entity.Property(e => e.InvoiceNumber)
                .HasMaxLength(50)
                .HasColumnName("invoice_number");
            entity.Property(e => e.InvoiceType)
                .HasDefaultValueSql("'tax_invoice'")
                .HasComment("Type of invoice")
                .HasColumnType("enum('tax_invoice','bill_of_supply','credit_note','debit_note')")
                .HasColumnName("invoice_type");
            entity.Property(e => e.IsInterState)
                .HasDefaultValueSql("'0'")
                .HasColumnName("is_inter_state");
            entity.Property(e => e.Notes)
                .HasColumnType("text")
                .HasColumnName("notes");
            entity.Property(e => e.PlaceOfSupply)
                .HasComment("Indian states for GST")
                .HasColumnType("enum('AN','AP','AR','AS','BR','CH','CT','DD','DL','GA','GJ','HP','HR','JH','JK','KA','KL','LA','LD','MH','ML','MN','MP','MZ','NL','OD','PB','PY','RJ','SK','TN','TS','TR','UK','UP','WB')")
                .HasColumnName("place_of_supply");
            entity.Property(e => e.SgstAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("sgst_amount");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'draft'")
                .HasComment("Invoice status")
                .HasColumnType("enum('draft','sent','paid','partial','overdue','cancelled')")
                .HasColumnName("status");
            entity.Property(e => e.Subtotal)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("subtotal");
            entity.Property(e => e.Terms)
                .HasColumnType("text")
                .HasColumnName("terms");
            entity.Property(e => e.TotalAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("total_amount");
            entity.Property(e => e.TotalTax)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("total_tax");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Business).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.BusinessId)
                .HasConstraintName("invoices_ibfk_1");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("invoices_ibfk_3");

            entity.HasOne(d => d.Customer).WithMany(p => p.Invoices)
                .HasForeignKey(d => d.CustomerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("invoices_ibfk_2");
        });

        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("invoice_items")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.GstRateId, "gst_rate_id");

            entity.HasIndex(e => e.InvoiceId, "idx_invoice_items_invoice_id");

            entity.HasIndex(e => e.ProductId, "idx_invoice_items_product_id");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CgstAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("cgst_amount");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.DiscountPercent)
                .HasPrecision(5, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("discount_percent");
            entity.Property(e => e.GstRateId).HasColumnName("gst_rate_id");
            entity.Property(e => e.HsnSacCode)
                .HasColumnType("text")
                .HasColumnName("hsn_sac_code");
            entity.Property(e => e.IgstAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("igst_amount");
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.ProductId).HasColumnName("product_id");
            entity.Property(e => e.Quantity)
                .HasPrecision(12, 3)
                .HasDefaultValueSql("'1.000'")
                .HasColumnName("quantity");
            entity.Property(e => e.SgstAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("sgst_amount");
            entity.Property(e => e.TaxableAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("taxable_amount");
            entity.Property(e => e.TotalAmount)
                .HasPrecision(12, 2)
                .HasDefaultValueSql("'0.00'")
                .HasColumnName("total_amount");
            entity.Property(e => e.Unit)
                .HasMaxLength(20)
                .HasDefaultValueSql("'NOS'")
                .HasColumnName("unit");
            entity.Property(e => e.UnitPrice)
                .HasPrecision(12, 2)
                .HasColumnName("unit_price");

            entity.HasOne(d => d.GstRate).WithMany(p => p.InvoiceItems)
                .HasForeignKey(d => d.GstRateId)
                .HasConstraintName("invoice_items_ibfk_3");

            entity.HasOne(d => d.Invoice).WithMany(p => p.InvoiceItems)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("invoice_items_ibfk_1");

            entity.HasOne(d => d.Product).WithMany(p => p.InvoiceItems)
                .HasForeignKey(d => d.ProductId)
                .HasConstraintName("invoice_items_ibfk_2");
        });

        modelBuilder.Entity<InvoiceItemTaxis>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("invoice_item_taxes")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.InvoiceItemId, "fk_invoice_item_tax");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.InvoiceItemId).HasColumnName("invoice_item_id");
            entity.Property(e => e.TaxAmount)
                .HasPrecision(14, 2)
                .HasColumnName("tax_amount");
            entity.Property(e => e.TaxRate)
                .HasPrecision(5, 2)
                .HasColumnName("tax_rate");
            entity.Property(e => e.TaxType)
                .HasColumnType("enum('CGST','SGST','IGST')")
                .HasColumnName("tax_type");

            entity.HasOne(d => d.InvoiceItem).WithMany(p => p.InvoiceItemTaxes)
                .HasForeignKey(d => d.InvoiceItemId)
                .HasConstraintName("fk_invoice_item_tax");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("payments")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.CreatedBy, "idx_payments_created_by");

            entity.HasIndex(e => e.InvoiceId, "idx_payments_invoice_id");

            entity.HasIndex(e => e.PaymentDate, "idx_payments_payment_date");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Amount)
                .HasPrecision(12, 2)
                .HasColumnName("amount");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.Notes)
                .HasColumnType("text")
                .HasColumnName("notes");
            entity.Property(e => e.PaymentDate)
                .HasDefaultValueSql("curdate()")
                .HasColumnName("payment_date");
            entity.Property(e => e.PaymentMethod)
                .HasColumnType("enum('cash','bank','upi','card','cheque')")
                .HasColumnName("payment_method");
            entity.Property(e => e.ReferenceNumber)
                .HasColumnType("text")
                .HasColumnName("reference_number");
            entity.Property(e => e.Status)
                .HasDefaultValueSql("'Pending'")
                .HasColumnType("enum('Pending','Completed','Failed')")
                .HasColumnName("status");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.Payments)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("payments_ibfk_2");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Payments)
                .HasForeignKey(d => d.InvoiceId)
                .HasConstraintName("payments_ibfk_1");
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("products")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.GstRateId, "gst_rate_id");

            entity.HasIndex(e => e.BusinessId, "idx_products_business_id");

            entity.HasIndex(e => e.IsActive, "idx_products_is_active");

            entity.HasIndex(e => e.Name, "idx_products_name").HasAnnotation("MySql:IndexPrefixLength", new[] { 255 });

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.BusinessId).HasColumnName("business_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Description)
                .HasColumnType("text")
                .HasColumnName("description");
            entity.Property(e => e.GstRateId).HasColumnName("gst_rate_id");
            entity.Property(e => e.HsnSacCode)
                .HasColumnType("text")
                .HasColumnName("hsn_sac_code");
            entity.Property(e => e.IsActive)
                .HasDefaultValueSql("'1'")
                .HasColumnName("is_active");
            entity.Property(e => e.IsService)
                .HasDefaultValueSql("'0'")
                .HasColumnName("is_service");
            entity.Property(e => e.Name)
                .HasColumnType("text")
                .HasColumnName("name");
            entity.Property(e => e.Unit)
                .HasMaxLength(20)
                .HasDefaultValueSql("'NOS'")
                .HasColumnName("unit");
            entity.Property(e => e.UnitPrice)
                .HasPrecision(12, 2)
                .HasColumnName("unit_price");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Business).WithMany(p => p.Products)
                .HasForeignKey(d => d.BusinessId)
                .HasConstraintName("products_ibfk_1");

            entity.HasOne(d => d.GstRate).WithMany(p => p.Products)
                .HasForeignKey(d => d.GstRateId)
                .HasConstraintName("products_ibfk_2");
        });

        modelBuilder.Entity<Profile>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("profiles")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.BusinessId, "idx_profiles_business_id");

            entity.HasIndex(e => e.Role, "idx_profiles_role");

            entity.Property(e => e.Id)
                .ValueGeneratedOnAdd()
                .HasColumnName("id");
            entity.Property(e => e.BusinessId).HasColumnName("business_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasColumnType("text")
                .HasColumnName("email");
            entity.Property(e => e.FullName)
                .HasColumnType("text")
                .HasColumnName("full_name");
            entity.Property(e => e.Role)
                .HasDefaultValueSql("'viewer'")
                .HasComment("Application role")
                .HasColumnType("enum('admin','accountant','viewer')")
                .HasColumnName("role");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Business).WithMany(p => p.Profiles)
                .HasForeignKey(d => d.BusinessId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("profiles_ibfk_2");

            entity.HasOne(d => d.IdNavigation).WithOne(p => p.Profile)
                .HasForeignKey<Profile>(d => d.Id)
                .HasConstraintName("profiles_ibfk_1");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("user_roles")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.Role, "idx_user_roles_role");

            entity.HasIndex(e => e.UserId, "idx_user_roles_user_id");

            entity.HasIndex(e => new { e.UserId, e.Role }, "unique_user_role").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Role)
                .HasComment("Application role")
                .HasColumnType("enum('admin','accountant','viewer')")
                .HasColumnName("role");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("user_roles_ibfk_1");
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity
                .ToTable("vendors")
                .UseCollation("utf8mb4_unicode_ci");

            entity.HasIndex(e => e.BusinessId, "idx_vendors_business_id");

            entity.HasIndex(e => e.IsActive, "idx_vendors_is_active");

            entity.HasIndex(e => e.Name, "idx_vendors_name").HasAnnotation("MySql:IndexPrefixLength", new[] { 255 });

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AddressLine1)
                .HasColumnType("text")
                .HasColumnName("address_line1");
            entity.Property(e => e.AddressLine2)
                .HasColumnType("text")
                .HasColumnName("address_line2");
            entity.Property(e => e.BusinessId).HasColumnName("business_id");
            entity.Property(e => e.City)
                .HasColumnType("text")
                .HasColumnName("city");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasColumnType("text")
                .HasColumnName("email");
            entity.Property(e => e.Gstin)
                .HasColumnType("text")
                .HasColumnName("gstin");
            entity.Property(e => e.IsActive)
                .HasDefaultValueSql("'1'")
                .HasColumnName("is_active");
            entity.Property(e => e.Name)
                .HasColumnType("text")
                .HasColumnName("name");
            entity.Property(e => e.Pan)
                .HasColumnType("text")
                .HasColumnName("pan");
            entity.Property(e => e.Phone)
                .HasColumnType("text")
                .HasColumnName("phone");
            entity.Property(e => e.Pincode)
                .HasColumnType("text")
                .HasColumnName("pincode");
            entity.Property(e => e.State)
                .HasComment("Indian states for GST")
                .HasColumnType("enum('AN','AP','AR','AS','BR','CH','CT','DD','DL','GA','GJ','HP','HR','JH','JK','KA','KL','LA','LD','MH','ML','MN','MP','MZ','NL','OD','PB','PY','RJ','SK','TN','TS','TR','UK','UP','WB')")
                .HasColumnName("state");
            entity.Property(e => e.UpdatedAt)
                .ValueGeneratedOnAddOrUpdate()
                .HasDefaultValueSql("CURRENT_TIMESTAMP")
                .HasColumnType("timestamp")
                .HasColumnName("updated_at");

            entity.HasOne(d => d.Business).WithMany(p => p.Vendors)
                .HasForeignKey(d => d.BusinessId)
                .HasConstraintName("vendors_ibfk_1");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
