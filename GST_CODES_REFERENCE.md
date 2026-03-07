# GST Rate Reference - Common HSN/SAC Codes

## HSN Codes Reference (Products)

### 5% GST Rate (Essential Goods)
| HSN Code | Description | Category |
|----------|-------------|----------|
| 0105 | Live animals (except aquatic) | Animal Products |
| 0201 | Beef/buffalo meat | Animal Products |
| 0401 | Milk, fresh/sweet | Dairy |
| 0701 | Potatoes, edible | Vegetables |
| 0801 | Dates | Fruits/Nuts |
| 1001 | Wheat | Cereals |
| 1201 | Oil seeds | Fruits/Seeds |

### 12% GST Rate (Mid-Tier Goods)
| HSN Code | Description | Category |
|----------|-------------|----------|
| 2507 | Kaolin/china clay | Minerals |
| 4801 | Newsprint | Paper |
| 6801 | Stone, slate, marble | Stone |
| 6903 | Ceramic products | Ceramics |
| 7001 | Glass shapes | Glass |

### 18% GST Rate (Standard Goods/Services)
| HSN Code | Description | Category |
|----------|-------------|----------|
| 2844 | Radioactive elements | Chemicals |
| 2905 | Acyclic alcohols | Chemicals |
| 3004 | Medicinal preparations | Pharmaceuticals |
| 3305 | Hair preparations | Cosmetics |
| 8471 | Electronic data machines | Electronics |
| 8517 | Telephone apparatus | Electronics |
| 8528 | Television sets | Electronics |
| 8704 | Motor vehicles (freight) | Vehicles |
| 9002 | Optical elements | Optics |

### 28% GST Rate (Luxury/Special Goods)
| HSN Code | Description | Category |
|----------|-------------|----------|
| 2402 | Cigars, cigarettes, tobacco | Tobacco |
| 2710 | Petroleum oils | Fuels |
| 8704 | Motor cars (private use) | Vehicles |
| 8711 | Motorcycles | Vehicles |

### 0% GST Rate (Exempted)
| HSN Code | Description | Category |
|----------|-------------|----------|
| 7108 | Gold, unwrought | Precious Metals |
| 7110 | Platinum, unwrought | Precious Metals |

---

## SAC Codes Reference (Services)

### 0% GST Rate (Exempt Services)
| SAC Code | Description |
|----------|-------------|
| 9993 | Education services by educational institutions |
| 10007 | Health services by government hospitals |

### 5% GST Rate (Lower Rated Services)
| SAC Code | Description |
|----------|-------------|
| 9954 | Surface road transport services |
| 9955 | Railway services |
| 9956 | Air transport services |
| 9991 | Accommodation, hotels, guest houses |
| 9996 | Healthcare services by private practitioners |

### 18% GST Rate (Standard Services)
| SAC Code | Description |
|----------|-------------|
| 9963 | Information technology services |
| 9964 | Accounting, bookkeeping services |
| 9965 | Legal services |
| 9966 | Personnel services |
| 9967 | Contract research services |
| 9968 | Services of repair and maintenance |
| 9961 | Architect services |
| 9962 | Engineering services |
| 9973 | Miscellaneous services |
| 998313 | General services / Consultancy |

---

## Test Scenarios

### Scenario 1: Product with 18% GST (Electronics)
```
HSN Code: 8471
Item Type: Product
Expected GST: 18%
```

### Scenario 2: Service with 18% GST (IT Services)
```
SAC Code: 9963
Item Type: Service
Expected GST: 18%
```

### Scenario 3: Essential Item with 5% GST
```
HSN Code: 0701 (Potatoes)
Item Type: Product
Expected GST: 5%
```

### Scenario 4: Education Service with 0% GST
```
SAC Code: 9993
Item Type: Service
Expected GST: 0%
```

### Scenario 5: No Match (Manual Selection)
```
HSN Code: 1234 (Invalid/Unknown)
Item Type: Product
Expected Result: No automatic suggestion, user prompted to select manually
```

---

## How to Use These Codes in the Application

### Adding a Product:
1. Click "Add Product" button
2. Enter product details
3. In "HSN Code" field, enter code (e.g., `8471`)
4. Application automatically suggests 18% GST
5. Click "Apply" to accept suggestion
6. Save product

### Adding a Service:
1. Click "Add Product" button
2. Toggle "Is this a Service?" to ON
3. Enter service details
4. In "SAC Code" field, enter code (e.g., `9963`)
5. Application automatically suggests 18% GST
6. Click "Apply" to accept suggestion
7. Save service

---

## Notes on GST Rules

1. **HSN Codes** (HS Nomenclature):
   - 2-digit codes represent HSN chapters (01-99)
   - Each chapter groups similar products
   - GST rate determined by chapter prefix
   - All 2-digit combos between 01-99 are covered

2. **SAC Codes** (Service Accounting Code):
   - 6-digit Indian codes for services
   - Most services fall under 998xxx range
   - Specific service types have dedicated codes
   - Services generally have higher GST rates than products

3. **Rate Changes**:
   - These rates are effective as of March 2026
   - Check GST Council notifications for updates
   - Different rates may apply based on item usage/classification
   - Always verify with latest official GST rules

4. **Manual Override**:
   - Even with auto-suggestions, admins can manually select any rate
   - Useful for special cases or exemptions
   - All available rates from database always shown in dropdown

---

## Common Mistakes to Avoid

❌ **Wrong:** Entering full 6-digit HSN code
- **Correct:** Use 2-digit chapter prefix (e.g., `84` instead of `8471XX`)

❌ **Wrong:** Using HSN code for services
- **Correct:** Use SAC code for services (998xxx)

❌ **Wrong:** Using SAC code for products  
- **Correct:** Use HSN code for products (01-99 chapters)

❌ **Wrong:** Entering codes with special characters
- **Correct:** Use only numbers and ensure format matches standard (e.g., `8471` not `84-71`)

---

## Resources for Additional Codes

- **Official GST Website:** www.gst.gov.in
- **HSN Code Search:** www.cbic.gov.in (Harmonized System Nomenclature)
- **SAC Code List:** www.gst.gov.in/services-accounting-code
- **GST Rate Finder:** Check GST rate tool on official portal

---

Last Updated: March 2026
