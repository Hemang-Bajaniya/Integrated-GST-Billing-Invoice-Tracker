using System;
using System.Collections.Generic;

namespace InvoiceFlow.API.InvoiceFlow.Infrastructure.Models;

public partial class Product
{
    public Guid Id { get; set; }

    public Guid BusinessId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string? HsnSacCode { get; set; }

    public string? Unit { get; set; }

    public decimal UnitPrice { get; set; }

    public Guid GstRateId { get; set; }

    public bool? IsService { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BusinessProfile Business { get; set; } = null!;

    public virtual GstRate GstRate { get; set; } = null!;

    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();
}
