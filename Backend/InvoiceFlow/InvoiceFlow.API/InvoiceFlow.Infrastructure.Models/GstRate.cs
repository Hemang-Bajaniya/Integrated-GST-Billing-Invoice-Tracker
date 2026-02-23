using System;
using System.Collections.Generic;

namespace InvoiceFlow.API.InvoiceFlow.Infrastructure.Models;

public partial class GstRate
{
    public Guid Id { get; set; }

    public decimal Rate { get; set; }

    public DateOnly? EffectiveFrom { get; set; }

    public DateOnly? EffectiveTo { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<InvoiceItem> InvoiceItems { get; set; } = new List<InvoiceItem>();

    public virtual ICollection<Product> Products { get; set; } = new List<Product>();
}
