using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class BusinessProfile
{
    public Guid Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Gstin { get; set; }

    public string? Pan { get; set; }

    public string? AddressLine1 { get; set; }

    public string? AddressLine2 { get; set; }

    public string? City { get; set; }

    /// <summary>
    /// Indian states for GST
    /// </summary>
    public string? State { get; set; }

    public string? Pincode { get; set; }

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? BankName { get; set; }

    public string? BankAccountNumber { get; set; }

    public string? BankIfsc { get; set; }

    public string? InvoicePrefix { get; set; }

    public int? InvoiceCounter { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<AuthUser> AuthUsers { get; set; } = new List<AuthUser>();

    public virtual ICollection<Customer> Customers { get; set; } = new List<Customer>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    public virtual ICollection<Profile> Profiles { get; set; } = new List<Profile>();

    public virtual ICollection<Vendor> Vendors { get; set; } = new List<Vendor>();
}
