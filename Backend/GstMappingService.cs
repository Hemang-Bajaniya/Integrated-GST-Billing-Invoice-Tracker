using InvoiceFlow.Infrastructure.Models;
using System.Collections.Generic;
using System.Linq;

namespace InvoiceFlow.API.Services;

/// <summary>
/// Service to determine appropriate GST rates based on HSN/SAC codes
/// following Indian GST rules and commodity classifications.
/// </summary>
public class GstMappingService
{
    // HSN code prefixes to GST rate mapping (2-digit HSN prefix)
    private static readonly Dictionary<string, decimal> HsnPrefixToGstRate = new()
    {
        // Chapter 01-09: Animal & Plant Products
        { "01", 5m },   // Live animals
        { "02", 5m },   // Meat and edible meat offal
        { "03", 5m },   // Fish and crustaceans
        { "04", 5m },   // Dairy, eggs, honey
        { "05", 5m },   // Products of animal origin
        { "06", 5m },   // Live trees and plants
        { "07", 5m },   // Edible vegetables
        { "08", 5m },   // Edible fruit and nuts
        { "09", 5m },   // Coffee, tea, spices

        // Chapter 10-15: Foodstuff
        { "10", 5m },   // Cereals
        { "11", 5m },   // Products of milling industry
        { "12", 5m },   // Oil seeds and oleaginous fruits
        { "13", 5m },   // Lac, gums, resins
        { "14", 5m },   // Vegetable plaiting materials
        { "15", 5m },   // Animal or vegetable fats and oils

        // Chapter 16-24: Prepared foodstuff
        { "16", 5m },   // Preparations of meat, fish
        { "17", 5m },   // Sugars and sugar confectionery
        { "18", 5m },   // Cocoa and cocoa preparations
        { "19", 5m },   // Preparations of cereals
        { "20", 5m },   // Preparations of vegetables
        { "21", 5m },   // Miscellaneous edible preparations
        { "22", 5m },   // Beverages and vinegar
        { "23", 5m },   // Food waste
        { "24", 28m },  // Tobacco (28% GST)

        // Chapter 25-27: Minerals
        { "25", 5m },   // Salt, sulphur, earth
        { "26", 5m },   // Ores, slag, ash
        { "27", 5m },   // Mineral fuels, oils

        // Chapter 28-38: Chemicals
        { "28", 18m },  // Inorganic chemicals
        { "29", 18m },  // Organic chemicals
        { "30", 12m },  // Pharmaceutical products
        { "31", 5m },   // Fertilizers
        { "32", 18m },  // Tanning, dyeing extracts
        { "33", 18m },  // Essential oils, perfumery
        { "34", 18m },  // Soap, wax, polishing
        { "35", 18m },  // Albuminoidal substances
        { "36", 18m },  // Explosives, pyrotechnics
        { "37", 18m },  // Photographic supplies
        { "38", 18m },  // Miscellaneous chemical products

        // Chapter 39-40: Plastics & Rubber
        { "39", 18m },  // Plastics and plastic articles
        { "40", 18m },  // Rubber and rubber articles

        // Chapter 41-43: Hides, Skins, Furs
        { "41", 5m },   // Raw hides and skins
        { "42", 18m },  // Articles of leather
        { "43", 18m },  // Furs and fur articles

        // Chapter 44-49: Wood, Paper, Textiles
        { "44", 12m },  // Wood and wood products
        { "45", 5m },   // Cork and cork articles
        { "46", 5m },   // Plaiting materials products
        { "47", 5m },   // Pulp of wood
        { "48", 12m },  // Paper and paperboard
        { "49", 5m },   // Printed books, newspapers

        // Chapter 50-60: Textile products
        { "50", 5m },   // Silk
        { "51", 5m },   // Wool and animal hair
        { "52", 5m },   // Cotton
        { "53", 5m },   // Vegetable textile fibers
        { "54", 5m },   // Synthetic filament yarn
        { "55", 5m },   // Synthetic staple fibers
        { "56", 5m },   // Wadding, felt, nonwovens
        { "57", 5m },   // Carpets and rugs
        { "58", 5m },   // Special woven fabrics
        { "59", 5m },   // Impregnated coated textiles
        { "60", 5m },   // Knitted or crocheted fabrics

        // Chapter 61-65: Apparel & Accessories
        { "61", 5m },   // Apparel and clothing knitted
        { "62", 5m },   // Apparel and clothing not knitted
        { "63", 5m },   // Made-up textiles
        { "64", 5m },   // Footwear
        { "65", 5m },   // Headgear and parts

        // Chapter 66-70: Other products
        { "66", 18m },  // Umbrellas, walking sticks
        { "67", 5m },   // Bird skins, feathers
        { "68", 12m },  // Stone, plaster, cement
        { "69", 12m },  // Ceramic products
        { "70", 12m },  // Glass and glassware

        // Chapter 71: Precious metals, gems
        { "71", 0m },   // Precious metals (exempted)

        // Chapter 72-83: Metals
        { "72", 18m },  // Iron and steel
        { "73", 18m },  // Articles of iron or steel
        { "74", 18m },  // Copper and articles
        { "75", 18m },  // Nickel and articles
        { "76", 18m },  // Aluminium and articles
        { "77", 18m },  // Reserved
        { "78", 18m },  // Lead and articles
        { "79", 18m },  // Zinc and articles
        { "80", 18m },  // Tin and articles
        { "81", 18m },  // Other metals
        { "82", 18m },  // Tools, cutlery
        { "83", 18m },  // Miscellaneous articles of metal

        // Chapter 84-90: Machinery & Electrical
        { "84", 18m },  // Boilers, machinery
        { "85", 18m },  // Electrical machinery
        { "86", 5m },   // Railway locomotives
        { "87", 18m },  // Vehicles (except rail)
        { "88", 18m },  // Aircraft and parts
        { "89", 18m },  // Ships and boats
        { "90", 18m },  // Optical, measuring instruments

        // Chapter 91-97: Miscellaneous
        { "91", 18m },  // Watches and clocks
        { "92", 18m },  // Musical instruments
        { "93", 18m },  // Arms and ammunition
        { "94", 18m },  // Furniture
        { "95", 18m },  // Toys, games, sports
        { "96", 18m },  // Miscellaneous manufactured
        { "97", 5m },   // Works of art, antiques

        // Chapter 98-99: Reserved/Special
        { "98", 18m },  // Reserved
        { "99", 18m },  // Reserved
    };

    // SAC code prefixes to GST rate mapping for Services (Accounting codes)
    private static readonly Dictionary<string, decimal> SacPrefixToGstRate = new()
    {
        // 998xxx - Services (mostly 18%)
        { "998", 18m },  // General services

        // 9985 - Specific Service Codes
        { "9985", 18m }, // Management, business consultancy
        { "9986", 18m }, // Architecture, engineering services
        { "9961", 18m }, // Architect services
        { "9962", 18m }, // Engineering services
        { "9963", 18m }, // Information Technology services
        { "9964", 18m }, // Accounting, auditing services
        { "9965", 18m }, // Legal services
        { "9966", 18m }, // Personnel services
        { "9967", 18m }, // Contract research
        { "9968", 18m }, // Repair services
        { "9973", 18m }, // Miscellaneous services

        // Healthcare services (typically lower rates)
        { "9996", 5m },  // Hospital/healthcare services

        // Education services (0% - exempted for educational institutions)
        { "9993", 0m },  // Education services

        // Transportation
        { "9954", 5m },  // Road transportation
        { "9955", 5m },  // Rail transportation

        // Accommodation  
        { "9991", 5m },  // Hotel/lodging (simplified)
    };

    /// <summary>
    /// Suggests a GST rate based on the provided HSN/SAC code.
    /// Returns the applicable GST rate or null if no match found.
    /// </summary>
    public decimal? SuggestGstRate(string? hsnOrSacCode, bool isService)
    {
        if (string.IsNullOrWhiteSpace(hsnOrSacCode))
            return null;

        var code = hsnOrSacCode.Trim();

        if (isService)
        {
            // For services, try 4-digit SAC first, then 3-digit prefix
            if (code.Length >= 4 && SacPrefixToGstRate.TryGetValue(code[..4], out var rate4))
                return rate4;
            if (code.Length >= 3 && SacPrefixToGstRate.TryGetValue(code[..3], out var rate3))
                return rate3;
        }
        else
        {
            // For products, try 2-digit HSN prefix
            if (code.Length >= 2 && HsnPrefixToGstRate.TryGetValue(code[..2], out var rate2))
                return rate2;
        }

        return null;
    }

    /// <summary>
    /// Gets all possible GST rates available in the system.
    /// </summary>
    public List<decimal> GetAllRates()
    {
        var allRates = HsnPrefixToGstRate.Values
            .Concat(SacPrefixToGstRate.Values)
            .Distinct()
            .OrderBy(r => r)
            .ToList();

        return allRates;
    }

    /// <summary>
    /// Validates if a GST rate exists and returns it as a normalized value.
    /// </summary>
    public bool TryValidateGstRate(decimal rate, out decimal validatedRate)
    {
        validatedRate = default;
        var validRates = new[] { 0m, 5m, 12m, 18m, 28m };

        if (validRates.Contains(rate))
        {
            validatedRate = rate;
            return true;
        }

        return false;
    }
}
