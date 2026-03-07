# Quick Start Checklist - Dynamic GST Implementation

## Backend Setup (C# / ASP.NET Core)

### Files to Create:
- [ ] Create `GstMappingService.cs` in `InvoiceFlow.API/Services/`
- [ ] Create `GstSuggestionDtos.cs` in `InvoiceFlow.API/Dtos/`

### Files to Modify:
- [ ] Update `ProductsController.cs`:
  - [ ] Add `private readonly GstMappingService _gstMappingService;` field
  - [ ] Update constructor to accept `GstMappingService gstMappingService`
  - [ ] Add `SuggestGstRate()` endpoint method
  - [ ] Add `GetAvailableGstRates()` helper method
  - [ ] Add using statement: `using InvoiceFlow.API.Services;`

- [ ] Update `Program.cs` Startup:
  - [ ] Add `builder.Services.AddScoped<GstMappingService>();` in service registration

### Verification:
- [ ] Build solution - should compile without errors
- [ ] Test endpoint: POST `https://localhost:xxxx/api/products/suggest-gst-rate`
  - [ ] Test with HSN code `8471` (should suggest 18%)
  - [ ] Test with SAC code `9963` (should suggest 18%, isService=true)
  - [ ] Test with invalid code `9999` (should return isAutomatic=false)

---

## Frontend Setup (React/TypeScript)

### Files to Modify:
- [ ] Update `src/api/Products.service.ts`:
  - [ ] Add `GstSuggestionRequest` interface
  - [ ] Add `GstSuggestionResponse` interface
  - [ ] Add `suggestGstRate()` method to `productsApi` object

- [ ] Replace `src/components/forms/ProductForm.tsx`:
  - [ ] Backup old file first
  - [ ] Copy entire new ProductForm.tsx content
  - [ ] Ensure imports include: `Lightbulb`, `CheckCircle` from lucide-react
  - [ ] Ensure imports include: `Alert`, `AlertDescription` from ui components

### Dependencies Check:
- [ ] Verify `lucide-react` is installed (for icons)
- [ ] Verify `sonner` is installed (for toast notifications)
- [ ] Verify `react-hook-form` is installed
- [ ] Verify `zod` is installed (validation)

### Verification:
- [ ] Run dev server: `bun dev` or `npm run dev`
- [ ] Navigate to Products page
- [ ] Click "Add Product"
- [ ] Enter HSN Code: `8471`
- [ ] Verify blue suggestion alert appears with "Apply" button
- [ ] Click "Apply"
- [ ] Verify GST Rate dropdown is filled with 18%
- [ ] Toggle "Is this a Service?"
- [ ] Change code to `9963`
- [ ] Verify suggestion appears for service SAC code

---

## Database Considerations

### GST Rates Table:
- [ ] Ensure `GstRates` table has records for standard rates (0%, 5%, 12%, 18%, 28%)
- [ ] Each rate needs an `Id` (GUID), `Rate` (decimal), and optional EffectiveFrom/EffectiveTo dates
- [ ] Recommended test data:
  ```sql
  INSERT INTO GstRates (Id, Rate, EffectiveFrom, EffectiveTo)
  VALUES 
  (NEWID(), 0, NULL, NULL),
  (NEWID(), 5, NULL, NULL),
  (NEWID(), 12, NULL, NULL),
  (NEWID(), 18, NULL, NULL),
  (NEWID(), 28, NULL, NULL);
  ```

---

## Testing Checklist

### Unit Testing Backend:
- [ ] Test `SuggestGstRate()` with various HSN codes
- [ ] Test `SuggestGstRate()` with various SAC codes  
- [ ] Test with invalid codes
- [ ] Test with null/empty codes
- [ ] Test `GetAllRates()` returns correct values

### Integration Testing Frontend:
- [ ] Add new product with HSN code
- [ ] Auto-suggestion appears correctly
- [ ] Apply suggestion works
- [ ] Manual override works
- [ ] Edit existing product (suggestion appears on edit)
- [ ] Service toggle changes placeholder/label
- [ ] No matches handled gracefully
- [ ] Service is saved with correct GST rate

### End-to-End Testing:
- [ ] Create invoice with suggested GST product
- [ ] Verify invoice displays correct GST amount
- [ ] Verify GST is calculated correctly in totals
- [ ] Test with multiple products with different suggested rates

---

## Configuration Notes

### GST Codes Reference:
- **HSN Codes:** 2-digit codes (01-99) for products
  - Example: `8471` = Electronic computing machines
  - Mapped to rate based on chapter prefix

- **SAC Codes:** 6-digit codes starting with 998 for services
  - Example: `998313` = General services (18%)
  - Example: `999300` = Education services (0%)

### Customization:
- [ ] Review `GstMappingService` HSN/SAC mappings
- [ ] Customize rates per local GST rules if needed
- [ ] Add organization-specific commodity codes if required

---

## Troubleshooting

### Issue: "GstMappingService not found"
- **Solution:** Ensure service is registered in Program.cs with `AddScoped<GstMappingService>()`

### Issue: GST suggestion not appearing
- **Solution:** 
  - Check browser console for API errors
  - Verify backend endpoint is accessible
  - Ensure HSN/SAC code is at least 2 characters
  - Wait 500ms after typing (debounce delay)

### Issue: "Apply" button not filling GST rate
- **Solution:**
  - Verify GST rate from suggestion exists in `gstRates` array
  - Check that rate is correctly mapped to a GstRateDto.id
  - Verify database has corresponding GST rate record

### Issue: All suggestions return "No match"
- **Solution:**
  - Verify product toggle is set correctly (isService matches code type)
  - Check code prefix matches entries in `GstMappingService`
  - Review HSN/SAC code format (should start with matching prefix)

---

## Deployment Checklist

- [ ] Backend code reviewed and tested
- [ ] Frontend code reviewed and tested
- [ ] Database contains required GST rates
- [ ] Build succeeds without warnings
- [ ] Environment variables configured
- [ ] API endpoints accessible from frontend
- [ ] Dependency injection working
- [ ] Error handling tested
- [ ] User documentation updated

---

## Support Resources

- **GST Rates:** Check latest rates on docs/Implementation_Guide.md
- **API Reference:** See docs/Implementation_Guide.md for endpoint details
- **Troubleshooting:** See docs/Implementation_Guide.md "Troubleshooting" section

Last Updated: March 2026
