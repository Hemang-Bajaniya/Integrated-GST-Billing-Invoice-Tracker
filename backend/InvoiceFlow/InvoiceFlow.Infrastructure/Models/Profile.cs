using System;
using System.Collections.Generic;

namespace InvoiceFlow.Infrastructure.Models;

public partial class Profile
{
    public Guid Id { get; set; }

    public string Email { get; set; } = null!;

    public string? FullName { get; set; }

    /// <summary>
    /// Application role
    /// </summary>
    public string Role { get; set; } = null!;

    public Guid? BusinessId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual BusinessProfile? Business { get; set; }

    public virtual AuthUser IdNavigation { get; set; } = null!;
}
