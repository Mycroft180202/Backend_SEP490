# Backend Requirements - Admin Dashboard APIs

## 🎯 For Backend Developer - What Frontend Expects

### Current Status
✅ **Already Implemented by Backend**:
- `GET /users/artisans?pageIndex=1&pageSize=10` - Returns list of artisans

❌ **Still Needed from Backend**:
- Missing fields in response
- Status update endpoint
- Product and order endpoints

---

## 📋 Phase 1: Update Existing Endpoint

### Current Issue
The `/users/artisans` endpoint returns incomplete data. Frontend is using hardcoded fallbacks.

### Current Response (What We Get Now)
```json
{
  "items": [
    {
      "userID": "USER-20251118-071829",
      "shopName": null,
      "phoneNumber": "0393020000",
      "displayName": "Trần Đình Khánh",
      "bio": null,
      "rating": null,
      "shopUrlImage": null,
      "totalRevenue": 0,
      "addresses": []
    }
  ],
  "totalCount": 2,
  "isactive": false,
  "pageIndex": 1,
  "pageSize": 10,
  "totalPages": 1,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

### Expected Response (What Frontend Needs)
```json
{
  "items": [
    {
      "userID": "USER-20251118-071829",
      "shopName": "Gốm Bát Tràng",              // Currently null → POPULATE THIS
      "phoneNumber": "0393020000",
      "displayName": "Trần Đình Khánh",
      "email": "user@email.com",                 // Currently missing → ADD THIS
      "bio": "Nghệ nhân gốm sứ truyền thống",   // Currently null → POPULATE THIS
      "rating": 4.8,                             // Currently null → POPULATE THIS
      "shopUrlImage": "https://...",             // Currently null → POPULATE THIS
      "totalRevenue": 2500000,                   // ADD ACTUAL REVENUE
      "isActive": true,                          // Currently "isactive": false → RENAME & POPULATE
      "createdDate": "2025-01-15T10:00:00",     // Currently missing → ADD THIS
      "totalProducts": 45,                       // Currently missing → ADD THIS
      "totalOrders": 23,                         // Currently missing → ADD THIS
      "addresses": []
    }
  ],
  "totalCount": 2,
  "pageIndex": 1,
  "pageSize": 10,
  "totalPages": 1,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

### Changes Required
| Field | Current | Needed | Type | Priority |
|-------|---------|--------|------|----------|
| `shopName` | `null` | "Gốm Bát Tràng" | string | HIGH |
| `email` | Missing | "user@email.com" | string | HIGH |
| `bio` | `null` | "Description" | string | MEDIUM |
| `rating` | `null` | 4.5 | number | MEDIUM |
| `shopUrlImage` | `null` | "url" | string | LOW |
| `totalRevenue` | 0 | 2500000 | number | HIGH |
| `isActive` | "isactive": false | true | boolean | HIGH |
| `createdDate` | Missing | "2025-01-15T10:00:00" | string | MEDIUM |
| `totalProducts` | Missing | 45 | number | MEDIUM |
| `totalOrders` | Missing | 23 | number | MEDIUM |

---

## 📊 Phase 2: New Endpoints Needed

### 2.1 Status Update Endpoint

**Endpoint**: `PUT /users/artisans/{userId}/status`

**Purpose**: Approve, reject, or block seller accounts

**Request**:
```json
{
  "isActive": true  // or false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Artisan status updated successfully",
  "data": {
    "userID": "USER-20251118-071829",
    "displayName": "Trần Đình Khánh",
    "isActive": true,
    "updatedDate": "2025-11-22T15:30:00"
  }
}
```

**Frontend Usage**:
```javascript
// When admin clicks "Approve" button
await AdminSellerService.updateArtisanStatus(userId, 'active');

// When admin clicks "Block" button
await AdminSellerService.updateArtisanStatus(userId, 'suspended');
```

---

### 2.2 Get Seller Products Endpoint

**Endpoint**: `GET /users/artisans/{userId}/products?pageIndex=1&pageSize=10`

**Purpose**: Get all products sold by a specific artisan

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "productId": "PROD-001",
        "productName": "Đèn gốm sứ thủ công",
        "category": "Đèn & Sáng",
        "price": 450000,
        "stock": 45,
        "totalSold": 234,
        "rating": 4.8,
        "status": "active",
        "createdDate": "2025-10-15T10:00:00"
      }
    ],
    "totalCount": 45,
    "totalPages": 5
  }
}
```

---

### 2.3 Get Seller Orders Endpoint

**Endpoint**: `GET /users/artisans/{userId}/orders?pageIndex=1&pageSize=10`

**Purpose**: Get all orders for products from this artisan

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "orderId": "ORD-001",
        "customerName": "Nguyễn Văn A",
        "customerEmail": "customer@email.com",
        "productName": "Đèn gốm sứ",
        "quantity": 1,
        "price": 450000,
        "totalRevenue": 450000,
        "status": "Delivering",
        "createdDate": "2025-11-20T10:00:00"
      }
    ],
    "totalCount": 234,
    "totalPages": 24
  }
}
```

---

### 2.4 Get Seller Statistics Endpoint

**Endpoint**: `GET /users/artisans/{userId}/stats`

**Purpose**: Get overview statistics for a specific artisan

**Response**:
```json
{
  "success": true,
  "data": {
    "totalProducts": 45,
    "totalOrders": 234,
    "totalRevenue": 125000000,
    "averageRating": 4.8,
    "totalReviews": 1234,
    "accountStatus": "active",
    "joinDate": "2025-01-15",
    "lastOrderDate": "2025-11-20",
    "monthlyRevenue": 2500000,
    "monthlyOrders": 45,
    "topProducts": [
      {
        "productName": "Đèn gốm sứ",
        "totalSold": 234,
        "revenue": 105300000
      }
    ]
  }
}
```

---

### 2.5 Update Seller Profile Endpoint

**Endpoint**: `PUT /users/artisans/{userId}`

**Purpose**: Update seller information

**Request**:
```json
{
  "displayName": "Trần Đình Khánh",
  "shopName": "Gốm Bát Tràng",
  "email": "user@email.com",
  "phoneNumber": "0393020000",
  "bio": "Nghệ nhân gốm sứ truyền thống",
  "shopUrlImage": "https://..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Artisan profile updated successfully",
  "data": { /* Updated artisan object */ }
}
```

---

## 🔍 Summary of Changes Needed

### Priority 1 (Critical - Do First)
1. **Update** `GET /users/artisans` to include:
   - `email`
   - `isActive` (rename from `isactive`)
   - `totalRevenue` (actual values, not 0)
   - `createdDate`
   - Populate: `shopName`, `bio`, `rating`, `shopUrlImage`

2. **Create** `PUT /users/artisans/{userId}/status`
   - Update artisan approval status
   - Used for approve/reject/block operations

### Priority 2 (High - Do Next)
1. **Create** `GET /users/artisans/{userId}/products`
   - List seller's products
   - Needed for seller detail view

2. **Create** `GET /users/artisans/{userId}/orders`
   - List seller's orders
   - Needed for order history view

### Priority 3 (Medium - Nice to Have)
1. **Create** `GET /users/artisans/{userId}/stats`
   - Get seller statistics
   - Dashboard info

2. **Create** `PUT /users/artisans/{userId}`
   - Update seller profile
   - Edit form in detail view

---

## 💻 Sample C# Controller Implementation

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ArtisansController : ControllerBase
{
    // 1. GET /api/artisans - Already exists, needs update
    [HttpGet]
    public async Task<IActionResult> GetArtisans(
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string search = "",
        [FromQuery] string sortBy = "",
        [FromQuery] string sortOrder = "asc")
    {
        // Update to include all required fields
        var artisans = await _userService.GetArtisansAsync(pageIndex, pageSize, search);
        
        return Ok(new {
            items = artisans.Select(a => new {
                userID = a.Id,
                displayName = a.DisplayName,
                shopName = a.ShopName,  // Previously null
                email = a.Email,         // Add this
                phoneNumber = a.PhoneNumber,
                bio = a.Bio,            // Previously null
                rating = a.Rating,      // Previously null
                shopUrlImage = a.ShopImage,
                totalRevenue = a.Orders?.Sum(o => o.TotalAmount) ?? 0,  // Calculate actual
                isActive = a.IsActive,  // Rename from IsActive
                createdDate = a.CreatedDate,  // Add this
                totalProducts = a.Products?.Count ?? 0,  // Add this
                totalOrders = a.Orders?.Count ?? 0,  // Add this
            }),
            totalCount = artisans.TotalCount,
            pageIndex = pageIndex,
            pageSize = pageSize,
            totalPages = (int)Math.Ceiling((double)artisans.TotalCount / pageSize),
            hasPreviousPage = pageIndex > 1,
            hasNextPage = pageIndex < Math.Ceiling((double)artisans.TotalCount / pageSize)
        });
    }

    // 2. PUT /api/artisans/{userId}/status - New endpoint
    [HttpPut("{userId}/status")]
    public async Task<IActionResult> UpdateArtisanStatus(
        [FromRoute] string userId,
        [FromBody] UpdateStatusRequest request)
    {
        var artisan = await _userService.GetByIdAsync(userId);
        artisan.IsActive = request.IsActive;
        await _userService.UpdateAsync(artisan);
        
        return Ok(new {
            success = true,
            message = "Artisan status updated successfully",
            data = artisan
        });
    }

    // 3. GET /api/artisans/{userId}/products - New endpoint
    [HttpGet("{userId}/products")]
    public async Task<IActionResult> GetArtisanProducts(
        [FromRoute] string userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        var products = await _productService.GetByArtisanAsync(userId, pageIndex, pageSize);
        return Ok(products);
    }

    // 4. GET /api/artisans/{userId}/orders - New endpoint
    [HttpGet("{userId}/orders")]
    public async Task<IActionResult> GetArtisanOrders(
        [FromRoute] string userId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 10)
    {
        var orders = await _orderService.GetByArtisanAsync(userId, pageIndex, pageSize);
        return Ok(orders);
    }

    // 5. PUT /api/artisans/{userId} - New endpoint
    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateArtisanProfile(
        [FromRoute] string userId,
        [FromBody] UpdateProfileRequest request)
    {
        var artisan = await _userService.GetByIdAsync(userId);
        artisan.DisplayName = request.DisplayName;
        artisan.ShopName = request.ShopName;
        artisan.Email = request.Email;
        artisan.PhoneNumber = request.PhoneNumber;
        artisan.Bio = request.Bio;
        artisan.ShopImage = request.ShopUrlImage;
        
        await _userService.UpdateAsync(artisan);
        
        return Ok(new {
            success = true,
            message = "Artisan profile updated successfully",
            data = artisan
        });
    }

    // 6. GET /api/artisans/{userId}/stats - New endpoint
    [HttpGet("{userId}/stats")]
    public async Task<IActionResult> GetArtisanStats([FromRoute] string userId)
    {
        var artisan = await _userService.GetByIdAsync(userId);
        var stats = new {
            totalProducts = artisan.Products?.Count ?? 0,
            totalOrders = artisan.Orders?.Count ?? 0,
            totalRevenue = artisan.Orders?.Sum(o => o.TotalAmount) ?? 0,
            averageRating = artisan.Rating ?? 0,
            totalReviews = artisan.Reviews?.Count ?? 0,
            accountStatus = artisan.IsActive ? "active" : "inactive",
            joinDate = artisan.CreatedDate?.ToString("yyyy-MM-dd"),
            lastOrderDate = artisan.Orders?.OrderByDescending(o => o.CreatedDate).FirstOrDefault()?.CreatedDate?.ToString("yyyy-MM-dd"),
        };
        
        return Ok(new { success = true, data = stats });
    }
}

public class UpdateStatusRequest
{
    public bool IsActive { get; set; }
}

public class UpdateProfileRequest
{
    public string DisplayName { get; set; }
    public string ShopName { get; set; }
    public string Email { get; set; }
    public string PhoneNumber { get; set; }
    public string Bio { get; set; }
    public string ShopUrlImage { get; set; }
}
```

---

## ✅ Testing Checklist for Backend

After implementing these endpoints, test:

- [ ] `GET /users/artisans` returns all required fields
- [ ] `GET /users/artisans` returns correct `totalCount` and pagination
- [ ] `PUT /users/artisans/{userId}/status` updates `isActive` correctly
- [ ] `GET /users/artisans/{userId}/products` returns seller's products
- [ ] `GET /users/artisans/{userId}/orders` returns seller's orders
- [ ] `GET /users/artisans/{userId}/stats` returns correct statistics
- [ ] `PUT /users/artisans/{userId}` updates profile fields
- [ ] All endpoints require Admin authorization
- [ ] Invalid userId returns 404
- [ ] Invalid data returns validation errors

---

## 🎯 Expected Frontend Behavior After Backend Updates

Once you implement all these endpoints:

1. **Seller list will show real data** with shop names, emails, revenue, etc.
2. **Status buttons will work** to approve/block sellers
3. **Click seller detail** will show products and orders
4. **Edit seller profile** will have working form
5. **All data will be live** from your database

---

## 📞 Questions?

If you have questions about:
- **API response format** → Check examples above
- **Field mappings** → See the mapping table
- **Priority order** → Phase 1 is critical, Phase 2 is important, Phase 3 is nice-to-have
- **Sample code** → C# controller implementation provided above

