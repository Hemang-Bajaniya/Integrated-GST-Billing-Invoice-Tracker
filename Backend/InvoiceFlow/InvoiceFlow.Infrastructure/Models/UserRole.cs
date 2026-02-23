using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class UserRole
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    /// <summary>
    /// Application role
    /// </summary>
    public string Role { get; set; } = null!;

    public virtual AuthUser User { get; set; } = null!;
}
