// Add this to your existing ProductsController.cs

    private readonly GstMappingService _gstMappingService;

    // Update constructor
    public ProductsController(GstInvoiceTrackerDbContext db, GstMappingService gstMappingService)
    {
        _db = db;
        _gstMappingService = gstMappingService;
    }

    /// <summary>Suggests appropriate GST rate based on HSN/SAC code and item type.</summary>
    [HttpPost("suggest-gst-rate")]
    [ProducesResponseType(typeof(GstSuggestionResponse), 200)]
    [ProducesResponseType(400)]
    public IActionResult SuggestGstRate([FromBody] GstSuggestionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.HsnSacCode))
            return BadRequest(new GstSuggestionResponse
            {
                SuggestedRate = null,
                IsAutomatic = false,
                Message = "HSN/SAC code is required",
                AvailableRates = GetAvailableGstRates()
            });

        var suggestedRate = _gstMappingService.SuggestGstRate(request.HsnSacCode, request.IsService);
        
        var response = new GstSuggestionResponse
        {
            SuggestedRate = suggestedRate,
            IsAutomatic = suggestedRate.HasValue,
            Message = suggestedRate.HasValue 
                ? $"GST rate of {suggestedRate}% suggested based on {(request.IsService ? "SAC" : "HSN")} code {request.HsnSacCode}"
                : $"No automatic GST rate mapping found for {(request.IsService ? "SAC" : "HSN")} code {request.HsnSacCode}. Please select manually.",
            AvailableRates = GetAvailableGstRates()
        };

        return Ok(response);
    }

    /// <summary>Helper method to get all available GST rates from the database.</summary>
    private List<decimal> GetAvailableGstRates()
    {
        return _db.GstRates
            .Select(r => r.Rate)
            .OrderBy(r => r)
            .Distinct()
            .ToList();
    }
