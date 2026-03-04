using System;
using System.Collections.Generic;

namespace InvoiceFlow.API.InvoiceFlow.Infrastructure.Models;

public partial class AuditLog
{
    public Guid Id { get; set; }

    public string? EntityName { get; set; }

    public Guid? EntityId { get; set; }

    public string? Action { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public Guid? UserId { get; set; }

    public DateTime? CreatedAt { get; set; }
}
