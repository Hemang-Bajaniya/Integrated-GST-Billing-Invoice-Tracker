# Dynamic GST Rate Implementation Guide

This guide explains how to implement dynamic GST rate suggestions based on Indian GST rules for your invoice tracking application.

## Overview

The solution consists of:
1. **Backend Service (GstMappingService)** - Maps HSN/SAC codes to appropriate GST rates
2. **Backend Endpoint** - API endpoint to suggest GST rates based on code and item type
3. **Frontend Service** - Updated API service with GST suggestion method
4. **Frontend Form** - Enhanced ProductForm with auto-suggestions and manual override

## Files Created/Modified

### Backend Files

#### 1. `GstMappingService.cs`
**Location:** Place in `InvoiceFlow.API.Services/` folder

**Purpose:**
- Maintains comprehensive mappings of HSN codes (products) and SAC codes (services) to GST rates
- Implements Indian GST rules for different commodity categories
- Provides methods to suggest appropriate GST rates

**Key Features:**
- HSN Chapter-wise mappings (Chapter 01-99)
- Service-specific SAC mappings (998xxx codes)
- Methods:
  - `SuggestGstRate(code, isService)` - Returns suggested rate or null
  - `GetAllRates()` - Returns all available rates
  - `TryValidateGstRate(rate)` - Validates if rate is standard GST rate

**Standard GST Rates Covered:**
- 0% - Exempt items (precious metals, education services)
- 5% - Essential goods (food, agriculture, services)
- 12% - Mid-tier goods (ceramics, leather articles, chemicals)
- 18% - Standard goods/services (electronics, machinery, chemicals, professional services)
- 28% - Luxury goods (tobacco, vehicles, fuel)

#### 2. `GstSuggestionDtos.cs`
**Location:** Place in `InvoiceFlow.API.Dtos/` folder

**Contains:**
- `GstSuggestionRequest` - Input DTO with HSN/SAC code and item type
- `GstSuggestionResponse` - Output DTO with suggested rate, message, and available rates

#### 3. Update `ProductsController.cs`
**Modifications Needed:**

1. **Add field for GstMappingService:**
```csharp
private readonly GstMappingService _gstMappingService;
```

2. **Update constructor:**
```csharp
public ProductsController(GstInvoiceTrackerDbContext db, GstMappingService gstMappingService)
{
    _db = db;
    _gstMappingService = gstMappingService;
}
```

3. **Add new endpoint (POST /api/products/suggest-gst-rate):**
```csharp
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
```

#### 4. Update `Program.cs` (Dependency Injection)
**Add to service registration:**
```csharp
builder.Services.AddScoped<GstMappingService>();
```

### Frontend Files

#### 1. `Products.service.ts` - Updated
**Changes:**
- Added `GstSuggestionRequest` interface
- Added `GstSuggestionResponse` interface
- Added `suggestGstRate()` method to `productsApi`

#### 2. `ProductForm.tsx` - Enhanced
**New Features:**
- **Real-time GST Suggestion:** As user enters HSN/SAC code, suggests appropriate rate
- **Visual Indicators:**
  - Loading spinner while fetching suggestions
  - Blue alert for automatic suggestions with "Apply" button
  - Amber alert if no match found
  - Green badge showing "Auto-suggested" status
  - "Suggested" tag next to matching rate in dropdown
  
- **Auto-Application:** Click "Apply" button to auto-populate the GST rate dropdown
- **Manual Override:** Users (especially admins) can still manually select any available rate
- **Debounced Requests:** Waits 500ms after user stops typing to suggest (avoids excessive API calls)

**New Imports:**
- `Lightbulb` icon for suggestion alerts
- `CheckCircle` icon for apply button
- `Alert` and `AlertDescription` components

## Implementation Steps

### Step 1: Backend Setup

1. Copy `GstMappingService.cs` into your `InvoiceFlow.API.Services/` folder
2. Copy `GstSuggestionDtos.cs` into your `InvoiceFlow.API.Dtos/` folder
3. Update `ProductsController.cs`:
   - Add the field and update constructor
   - Add the new `SuggestGstRate` endpoint
   - Add the helper method `GetAvailableGstRates`
4. Add to `Program.cs`: `builder.Services.AddScoped<GstMappingService>();`
5. Ensure using statement: `using InvoiceFlow.API.Services;`

### Step 2: Frontend Setup

1. Update `Products.service.ts`:
   - Add the new interfaces
   - Add the new `suggestGstRate` method
2. Replace `ProductForm.tsx` with the updated version
3. No changes needed to `Products.tsx` (it will automatically benefit from the new form)

## Usage Examples

### For Products (HSN Codes):
- Enter HSN Code: `8471` → Suggests 18% (Electronics)
- Enter HSN Code: `0205` → Suggests 5% (Meat products)
- Enter HSN Code: `2701` → Suggests 5% (Coal, mineral fuels)

### For Services (SAC Codes):
- Enter SAC Code: `9963` → Suggests 18% (IT Services)
- Enter SAC Code: `9993` → Suggests 0% (Education Services)
- Enter SAC Code: `9965` → Suggests 18% (Legal Services)

## Admin Features

**Manual Override:**
- Even if a GST rate is suggested, admins can select any other rate from the dropdown
- The dropdown shows which rate was "Suggested" next to the rate
- All available rates from the database are always available for selection

**Fallback Behavior:**
- If HSN/SAC code doesn't match any known mapping, an amber alert appears
- User is prompted to manually select from available rates
- Available rates are fetched from the database

## Testing Scenarios

1. **Auto-Suggestion Test:**
   - Enter HSN code `8471`
   - Verify blue suggestion alert appears
   - Click "Apply"
   - Verify GST rate dropdown is populated with 18%

2. **No Match Test:**
   - Enter invalid HSN code `9999`
   - Verify amber alert appears
   - Verify user can still manually select a rate

3. **Service Toggle Test:**
   - Toggle "Is this a Service?" switch
   - Notice placeholder and label change (SAC vs HSN)
   - Enter SAC code `9963`
   - Verify correct suggestion for services

4. **Manual Override Test:**
   - Enter HSN code with auto-suggestion
   - Don't click "Apply"
   - Manually select different rate
   - Verify form accepts manual selection

## Maintenance

**To Update GST Mappings:**
1. Edit the static dictionaries in `GstMappingService.cs`:
   - `HsnPrefixToGstRate` for product codes
   - `SacPrefixToGstRate` for service codes
2. Add or modify entries as GST rules change
3. No database changes needed - service handles everything in code

**To Add New GST Rates:**
1. Add new rates to your `GstRates` table in database
2. Update `ValidateGstRate()` method if adding rates beyond 0%, 5%, 12%, 18%, 28%
3. No changes needed to UI - automatically included in suggestions

## API Endpoint Reference

### POST /api/products/suggest-gst-rate

**Request:**
```json
{
    "hsnSacCode": "8471",
    "isService": false
}
```

**Response (Match Found):**
```json
{
    "suggestedRate": 18,
    "isAutomatic": true,
    "message": "GST rate of 18% suggested based on HSN code 8471",
    "availableRates": [0, 5, 12, 18, 28]
}
```

**Response (No Match):**
```json
{
    "suggestedRate": null,
    "isAutomatic": false,
    "message": "No automatic GST rate mapping found for HSN code 9999. Please select manually.",
    "availableRates": [0, 5, 12, 18, 28]
}
```

## Architecture Benefits

1. **Maintainability:** All GST logic in one service, easy to update rules
2. **Flexibility:** Admins can always override auto-suggestions
3. **Performance:** Debounced suggestions avoid excessive API calls
4. **User Experience:** Clear visual feedback for every action
5. **Compliance:** Follows Indian GST commodity classification standards
6. **Data Consistency:** Suggestions tied to actual database rates, no hardcoding on UI

## Notes

- GST mappings are based on Indian GST Chapter classifications
- Rates can change over time - update `GstMappingService` when rules change
- SAC codes for services are standardized by GST council
- HSN codes for products follow HS nomenclature system
- Service always validates against database to ensure consistency
