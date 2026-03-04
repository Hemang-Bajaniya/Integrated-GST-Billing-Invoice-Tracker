using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class Customer
{
    public Guid Id { get; set; }

    public Guid BusinessId { get; set; }

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

    public bool IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BusinessProfile Business { get; set; } = null!;

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
