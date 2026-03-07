namespace InvoiceFlow.API.Dtos;

/// <summary>
/// DTO for suggesting GST rate based on HSN/SAC code.
/// </summary>
public class GstSuggestionRequest
{
    /// <summary>
    /// The HSN (for products) or SAC (for services) code
    /// </summary>
    public string? HsnSacCode { get; set; }

    /// <summary>
    /// Whether this is a service (true) or product (false)
    /// </summary>
    public bool IsService { get; set; }
}

/// <summary>
/// DTO for GST rate suggestion response.
/// </summary>
public class GstSuggestionResponse
{
    /// <summary>
    /// The suggested GST rate (as percentage, e.g., 18 for 18%)
    /// </summary>
    public decimal? SuggestedRate { get; set; }

    /// <summary>
    /// Whether the suggestion is based on an exact HSN/SAC code match
    /// </summary>
    public bool IsAutomatic { get; set; }

    /// <summary>
    /// User-friendly message explaining the suggestion
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// List of all available GST rates for fallback selection
    /// </summary>
    public List<decimal> AvailableRates { get; set; } = new();
}
