# Admin Dashboard - API Requirements & Mapping

## 📊 Dashboard Overview - Tổng Quan

### Current UI Components & Required APIs

---

## 1. **OVERVIEW SECTION** (Tab: Tổng quan)

### 1.1 Stats Cards (4 thẻ thống kê)

**Currently Hardcoded:**
```javascript
{
  totalOrders: 1247,
  totalRevenue: 458750000,
  totalProducts: 156,
  totalCustomers: 892,
  totalSellers: 45,
  orderGrowth: 12.5,
  revenueGrowth: 18.3,
  productGrowth: 5.2,
  customerGrowth: 8.7
}
```

**API Needed:**

#### 🔵 **GET /admin/dashboard/stats**
- **Purpose**: Get dashboard overview statistics
- **Response Format**:
```json
{
  "success": true,
  "data": {
    "totalOrders": 1247,
    "totalRevenue": 458750000,
    "totalProducts": 156,
    "totalCustomers": 892,
    "totalSellers": 45,
    "orderGrowth": 12.5,
    "revenueGrowth": 18.3,
    "productGrowth": 5.2,
    "customerGrowth": 8.7
  }
}
```

**Usage in Frontend:**
- Stats cards display (4 cards with icons & growth percentages)
- Optional: Monthly/yearly filtering

---

### 1.2 Recent Orders Table (Đơn hàng gần đây)

**Currently Hardcoded:**
```javascript
[
  { id: 'ORD-001', customer: 'Nguyễn Văn A', product: 'Đèn gốm sứ thủ công', amount: 450000, status: 'Đang giao', date: '2025-11-08' },
  { id: 'ORD-002', customer: 'Trần Thị B', product: 'Bình hoa gốm', amount: 320000, status: 'Hoàn thành', date: '2025-11-08' },
  // ... more orders
]
```

**API Needed:**

#### 🔵 **GET /admin/orders/recent**
- **Purpose**: Get recent orders (last 5-10 orders)
- **Query Parameters**:
  - `limit`: number (default: 5)
  - `sortBy`: 'date' | 'amount' (default: 'date')
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "Order-USER-20251122-072457-29e67117816c4544ada63a225d9e80f2",
      "orderId": "ORD-001",
      "customerName": "Nguyễn Văn A",
      "customerId": "cust-001",
      "productName": "Đèn gốm sứ thủ công",
      "productId": "prod-001",
      "quantity": 1,
      "total": 450000,
      "status": "Delivering",
      "statusDisplay": "Đang giao",
      "createdDate": "2025-11-08T10:30:00",
      "paymentMethod": "COD"
    },
    // ... more orders
  ],
  "totalCount": 1247
}
```

**Status Mapping**:
- Backend status → Frontend display
- `Pending` → `Đang xử lý`
- `Confirmed` → `Đã xác nhận`
- `Delivering` → `Đang giao`
- `Completed` → `Hoàn thành`
- `Cancelled` → `Đã hủy`

---

### 1.3 Top Products (Sản phẩm bán chạy)

**Currently Hardcoded:**
```javascript
[
  { name: 'Đèn gốm sứ thủ công', sales: 245, revenue: 110250000, stock: 45 },
  { name: 'Bình hoa gốm Bát Tràng', sales: 189, revenue: 60480000, stock: 32 },
  // ... more products
]
```

**API Needed:**

#### 🔵 **GET /admin/products/top-products**
- **Purpose**: Get top-selling products with revenue & stock
- **Query Parameters**:
  - `limit`: number (default: 5)
  - `period`: 'day' | 'week' | 'month' | 'year' (default: 'month')
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "productId": "prod-001",
      "productName": "Đèn gốm sứ thủ công",
      "totalSales": 245,
      "totalRevenue": 110250000,
      "currentStock": 45,
      "productImage": "https://...",
      "artisanName": "Gốm Bát Tràng Shop",
      "rating": 4.8
    },
    // ... more products
  ]
}
```

---

## 2. **PRODUCTS SECTION** (Tab: Sản phẩm)

**Component:** `ProductManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/products**
- **Purpose**: Get all products with pagination & filters
- **Query Parameters**:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `search`: string (search by name)
  - `artisanId`: string (filter by artisan)
  - `status`: 'active' | 'inactive' | 'pending'
  - `sortBy`: 'name' | 'createdDate' | 'price'
  - `sortOrder`: 'asc' | 'desc'
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "productId": "prod-001",
      "productName": "Đèn gốm sứ thủ công",
      "artisanId": "artisan-001",
      "artisanName": "Gốm Bát Tràng Shop",
      "category": "Đèn & Sáng",
      "price": 450000,
      "stock": 45,
      "status": "active",
      "rating": 4.8,
      "totalReviews": 234,
      "productImage": "https://...",
      "createdDate": "2025-10-15T10:30:00"
    }
  ],
  "totalCount": 156,
  "totalPages": 16
}
```

#### 🔵 **GET /admin/products/:productId**
- **Purpose**: Get product details for editing
- **Response**: Single product object (same structure as above, with more details)

#### 🟡 **PUT /admin/products/:productId**
- **Purpose**: Update product info
- **Body**:
```json
{
  "productName": "Updated name",
  "price": 500000,
  "stock": 50,
  "category": "Đèn & Sáng",
  "description": "...",
  "status": "active"
}
```

#### 🔴 **DELETE /admin/products/:productId**
- **Purpose**: Soft delete/deactivate product

---

## 3. **ORDERS SECTION** (Tab: Đơn hàng)

**Component:** `OrderManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/orders**
- **Purpose**: Get all orders with pagination & filters
- **Query Parameters**:
  - `page`: number
  - `limit`: number
  - `search`: string (search by order ID or customer name)
  - `status`: 'Pending' | 'Confirmed' | 'Delivering' | 'Completed' | 'Cancelled'
  - `dateFrom`: string (YYYY-MM-DD)
  - `dateTo`: string (YYYY-MM-DD)
  - `sortBy`: 'createdDate' | 'total'
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "id": "Order-USER-20251122-072457-29e67117816c4544ada63a225d9e80f2",
      "orderId": "ORD-001",
      "customerName": "Nguyễn Văn A",
      "customerId": "cust-001",
      "customerPhone": "0123456789",
      "customerAddress": "123 Đường A, TP HCM",
      "total": 450000,
      "shippingFee": 20500,
      "status": "Delivering",
      "statusDisplay": "Đang giao",
      "paymentMethod": "COD",
      "paymentStatus": "Pending",
      "itemCount": 1,
      "createdDate": "2025-11-08T10:30:00",
      "estimatedDelivery": "2025-11-10"
    }
  ],
  "totalCount": 1247,
  "totalPages": 125
}
```

#### 🔵 **GET /admin/orders/:orderId**
- **Purpose**: Get order details with items
- **Response**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD-001",
    "customerInfo": {
      "name": "Nguyễn Văn A",
      "phone": "0123456789",
      "email": "customer@email.com",
      "address": "123 Đường A, TP HCM"
    },
    "items": [
      {
        "productId": "prod-001",
        "productName": "Đèn gốm sứ thủ công",
        "quantity": 1,
        "price": 450000,
        "subtotal": 450000
      }
    ],
    "subtotal": 450000,
    "shippingFee": 20500,
    "discount": 0,
    "total": 450000,
    "status": "Delivering",
    "paymentMethod": "COD",
    "paymentStatus": "Pending",
    "createdDate": "2025-11-08T10:30:00"
  }
}
```

#### 🟡 **PUT /admin/orders/:orderId/status**
- **Purpose**: Update order status
- **Body**:
```json
{
  "status": "Delivering"
}
```

#### 🟡 **PUT /admin/orders/:orderId/payment-status**
- **Purpose**: Update payment status
- **Body**:
```json
{
  "paymentStatus": "Paid"
}
```

---

## 4. **CUSTOMERS SECTION** (Tab: Khách hàng)

**Component:** `CustomerManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/customers**
- **Purpose**: Get all customers with pagination & filters
- **Query Parameters**:
  - `page`: number
  - `limit`: number
  - `search`: string (name, email, phone)
  - `sortBy`: 'createdDate' | 'totalOrders' | 'totalSpent'
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "customerId": "cust-001",
      "name": "Nguyễn Văn A",
      "email": "customer@email.com",
      "phone": "0123456789",
      "totalOrders": 5,
      "totalSpent": 2250000,
      "status": "active",
      "lastOrderDate": "2025-11-08",
      "registeredDate": "2025-09-15",
      "avatarUrl": "https://..."
    }
  ],
  "totalCount": 892,
  "totalPages": 90
}
```

#### 🔵 **GET /admin/customers/:customerId**
- **Purpose**: Get customer details & order history
- **Response**:
```json
{
  "success": true,
  "data": {
    "customerId": "cust-001",
    "name": "Nguyễn Văn A",
    "email": "customer@email.com",
    "phone": "0123456789",
    "totalOrders": 5,
    "totalSpent": 2250000,
    "registeredDate": "2025-09-15",
    "orderHistory": [
      {
        "orderId": "ORD-001",
        "date": "2025-11-08",
        "total": 450000,
        "status": "Delivering"
      }
    ]
  }
}
```

---

## 5. **SELLERS SECTION** (Tab: Người bán)

**Component:** `SellerManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/artisans** (or /sellers)
- **Purpose**: Get all sellers/artisans
- **Query Parameters**: Same as customers
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "artisanId": "artisan-001",
      "artisanName": "Gốm Bát Tràng Shop",
      "contactEmail": "artisan@email.com",
      "contactPhone": "0123456789",
      "totalProducts": 45,
      "totalOrders": 234,
      "totalRevenue": 45875000,
      "rating": 4.8,
      "status": "active",
      "joinDate": "2025-08-10",
      "avatarUrl": "https://..."
    }
  ],
  "totalCount": 45,
  "totalPages": 5
}
```

#### 🔵 **GET /admin/artisans/:artisanId**
- **Purpose**: Get artisan details & products

#### 🟡 **PUT /admin/artisans/:artisanId/status**
- **Purpose**: Approve/Reject/Deactivate artisan
- **Body**:
```json
{
  "status": "active" | "inactive" | "suspended"
}
```

---

## 6. **VOUCHERS SECTION** (Tab: Voucher)

**Component:** `VoucherManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/vouchers**
- **Purpose**: Get all vouchers
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "voucherId": "voucher-001",
      "voucherCode": "SALE50",
      "description": "Giảm 50% cho sản phẩm gốm",
      "discountType": "percent" | "fixed",
      "discountValue": 50,
      "maxUses": 100,
      "usedCount": 23,
      "startDate": "2025-11-01",
      "endDate": "2025-11-30",
      "status": "active" | "expired" | "inactive",
      "createdDate": "2025-10-28"
    }
  ],
  "totalCount": 12
}
```

#### 🟢 **POST /admin/vouchers**
- **Purpose**: Create new voucher
- **Body**:
```json
{
  "voucherCode": "SALE50",
  "description": "...",
  "discountType": "percent",
  "discountValue": 50,
  "maxUses": 100,
  "startDate": "2025-11-01",
  "endDate": "2025-11-30"
}
```

#### 🟡 **PUT /admin/vouchers/:voucherId**
- **Purpose**: Update voucher

#### 🔴 **DELETE /admin/vouchers/:voucherId**
- **Purpose**: Delete voucher

---

## 7. **PRODUCT COLLECTIONS SECTION** (Tab: Bộ sưu tập)

**Component:** `ProductCollectionManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/collections**
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "collectionId": "coll-001",
      "collectionName": "Gốm thủ công truyền thống",
      "description": "...",
      "productCount": 25,
      "status": "active",
      "imageUrl": "https://...",
      "createdDate": "2025-10-01"
    }
  ],
  "totalCount": 8
}
```

#### 🟢 **POST /admin/collections**
- **Purpose**: Create collection

#### 🟡 **PUT /admin/collections/:collectionId**
- **Purpose**: Update collection

#### 🔴 **DELETE /admin/collections/:collectionId**
- **Purpose**: Delete collection

---

## 8. **REPORTS SECTION** (Tab: Báo cáo & Khiếu nại)

**Component:** `ReportManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/reports**
- **Purpose**: Get all reports/complaints
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "reportId": "report-001",
      "reportType": "product" | "seller" | "order",
      "reportedBy": "Khách hàng A",
      "reportedById": "cust-001",
      "targetId": "prod-001" | "artisan-001" | "ORD-001",
      "targetName": "Đèn gốm sứ",
      "reason": "Sản phẩm không đúng với mô tả",
      "description": "Màu sắc khác với ảnh, chất lượng kém",
      "status": "pending" | "investigating" | "resolved" | "rejected",
      "priority": "low" | "medium" | "high",
      "createdDate": "2025-11-08"
    }
  ],
  "totalCount": 24
}
```

#### 🔵 **GET /admin/reports/:reportId**
- **Purpose**: Get report details with evidence

#### 🟡 **PUT /admin/reports/:reportId/status**
- **Purpose**: Update report status
- **Body**:
```json
{
  "status": "resolved",
  "resolution": "Khách hàng sẽ được hoàn tiền",
  "actionTaken": "Cảnh báo người bán"
}
```

---

## 9. **BLOG SECTION** (Tab: Blog)

**Component:** `BlogManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/blogs**
- **Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "blogId": "blog-001",
      "title": "Bí quyết bảo quản gốm sứ",
      "slug": "bi-quyet-bao-quan-gom-su",
      "content": "...",
      "author": "Admin",
      "thumbnail": "https://...",
      "status": "published" | "draft",
      "viewCount": 1234,
      "publishedDate": "2025-11-08"
    }
  ]
}
```

#### 🟢 **POST /admin/blogs**
- **Purpose**: Create new blog post

#### 🟡 **PUT /admin/blogs/:blogId**
- **Purpose**: Update blog post

#### 🔴 **DELETE /admin/blogs/:blogId**
- **Purpose**: Delete blog post

---

## 10. **SETTINGS SECTION** (Tab: Cài đặt)

**Component:** `SettingsManagement.jsx`

### APIs Needed:

#### 🔵 **GET /admin/settings**
- **Response Format**:
```json
{
  "success": true,
  "data": {
    "storeName": "G90 Craft Store",
    "storeEmail": "admin@g90craft.com",
    "storePhone": "0123456789",
    "storeAddress": "123 Đường ABC, TP HCM",
    "shippingFee": 20500,
    "maintenanceMode": false,
    "supportEmail": "support@g90craft.com",
    "socialLinks": {
      "facebook": "https://facebook.com/g90craft",
      "instagram": "https://instagram.com/g90craft"
    }
  }
}
```

#### 🟡 **PUT /admin/settings**
- **Purpose**: Update settings

---

## Summary Table - API Checklist

| Section | Endpoints | Status |
|---------|-----------|--------|
| **Overview** | `GET /admin/dashboard/stats`, `GET /admin/orders/recent`, `GET /admin/products/top-products` | ❌ Pending |
| **Products** | `GET /admin/products`, `GET/PUT/DELETE /admin/products/:id` | ❌ Pending |
| **Orders** | `GET /admin/orders`, `GET /admin/orders/:id`, `PUT /admin/orders/:id/status` | ❌ Pending |
| **Customers** | `GET /admin/customers`, `GET /admin/customers/:id` | ❌ Pending |
| **Sellers** | `GET /admin/artisans`, `GET/PUT /admin/artisans/:id` | ❌ Pending |
| **Vouchers** | `GET/POST/PUT/DELETE /admin/vouchers` | ❌ Pending |
| **Collections** | `GET/POST/PUT/DELETE /admin/collections` | ❌ Pending |
| **Reports** | `GET /admin/reports`, `PUT /admin/reports/:id/status` | ❌ Pending |
| **Blog** | `GET/POST/PUT/DELETE /admin/blogs` | ❌ Pending |
| **Settings** | `GET/PUT /admin/settings` | ❌ Pending |

---

## Next Steps

1. ✅ Review this API specification
2. ⏳ Implement backend endpoints according to specs
3. ⏳ Update frontend service files to call these endpoints
4. ⏳ Replace hardcoded data with API calls
5. ⏳ Add error handling & loading states
6. ⏳ Test end-to-end

