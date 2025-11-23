# Order History Page Migration

## Overview
Refactored the Order History page to use the new `/api/Order/my-orders` API endpoint instead of mock data. The page now displays actual user orders with proper pagination, status filtering, and a redesigned UI component structure.

## Changes Made

### 1. **OrderHistory.jsx** (Main Page Component)
**Location:** `frontend/src/pages/OrderHistory.jsx`

**Changes:**
- Replaced static mock data with dynamic API calls
- Added state management for:
  - `orders` - array of order objects from API
  - `loading` - loading state while fetching
  - `selectedStatus` - current status filter (all, Pending, Paid)
  - `currentPage` - current pagination page
  - `totalPages` - total number of pages
- Implemented `fetchOrders()` callback function using `useCallback` to fetch orders from `OrderService.getMyOrders()`
- Added status mapping to filter orders by status
- Implemented pagination controls with "Trước" (Previous) and "Sau" (Next) buttons
- Added loading state UI during data fetch
- Proper error handling with toast notifications

**API Integration:**
```javascript
const response = await OrderService.getMyOrders(pageIndex, pageSize);
// Returns: { items[], totalCount, pageIndex, pageSize, totalPages, hasNextPage, hasPreviousPage }
```

### 2. **OrderList.jsx** (Display Component)
**Location:** `frontend/src/components/orderHistory/OrderList.jsx`

**Changes:**
- Completely redesigned from product-card based layout to order-card based layout
- Created new components:
  - `StatusBadge` - Displays order status with color coding (Pending: yellow, Paid: green)
  - `ProductItem` - Displays individual products within an order
  - `OrderCard` - Main order display component with:
    - Order header with order number, date, and status
    - Payment type display (COD vs VNPAY)
    - Total amount
    - Product items list with unit price and quantity
    - Action buttons (View details, Cancel order if status is Pending)

**Order Structure Handled:**
```javascript
{
  orderNumber: "ORDER-20251121-205419359",
  customerId: "USER-20251118-072457",
  status: "Pending" | "Paid",
  paymentType: "COD" | "VNPAY",
  totalAmount: 105500,
  createAt: "2025-11-21T20:54:19.36127Z",
  items: [
    { productID, quantity, unitPrice }
  ]
}
```

### 3. **SortBar.jsx** (Status Filter Component)
**Location:** `frontend/src/components/orderHistory/SortBar.jsx`

**Changes:**
- Updated status list to match API status values:
  - "all" (Tất cả)
  - "Pending" (Chờ thanh toán)
  - "Paid" (Đã thanh toán)
- Simplified UI with cleaner button styling
- Added border-bottom indicator for selected status
- Removed unnecessary image assets (imgEllipse32, imgGroup17)

### 4. **orderService.jsx** (Service Layer)
**Location:** `frontend/src/services/modules/orders/orderService.jsx`

**Changes:**
- Added `getMyOrders(pageIndex = 1, pageSize = 10)` method
- Endpoint: `GET /api/Order/my-orders`
- Parameters: `pageIndex`, `pageSize`
- Includes error handling and console logging

```javascript
async getMyOrders(pageIndex = 1, pageSize = 10) {
  try {
    const response = await axiosClient.get('/api/Order/my-orders', {
      params: { pageIndex, pageSize }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}
```

### 5. **formatCurrency.js** (New Utility)
**Location:** `frontend/src/utils/formatCurrency.js`

**Purpose:**
- Centralized currency formatting utility
- Vietnamese locale formatting with 'đ' suffix
- Used by OrderList and other components

```javascript
export const formatCurrency = (value, suffix = 'đ') => {
  if (value === null || value === undefined) return `0${suffix}`;
  return `${Number(value).toLocaleString('vi-VN')}${suffix}`;
};
```

## API Response Format

The `/api/Order/my-orders` endpoint returns:
```json
{
  "items": [
    {
      "orderNumber": "ORDER-20251121-205419359",
      "customerId": "USER-20251118-072457",
      "status": "Pending|Paid",
      "paymentType": "COD|VNPAY",
      "totalAmount": 105500,
      "shipingAddressId": "ADDR-...",
      "createAt": "2025-11-21T20:54:19.36127Z",
      "items": [
        { "productID": "PROD-001", "quantity": 1, "unitPrice": 50000 }
      ],
      "shipments": []
    }
  ],
  "totalCount": 52,
  "pageIndex": 1,
  "pageSize": 10,
  "totalPages": 6,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## Status Mapping

| API Status | Display Label | Color | Notes |
|-----------|---------------|-------|-------|
| Pending | Chờ thanh toán | Yellow (#FFF3CD) | Awaiting payment |
| Paid | Đã thanh toán | Green (#D4EDDA) | Payment confirmed |

## Features Implemented

✅ **Dynamic Data Loading** - Fetches real orders from API
✅ **Pagination** - Navigate through orders with page controls
✅ **Status Filtering** - Filter orders by status (All, Pending, Paid)
✅ **Loading State** - Shows "Đang tải..." during API calls
✅ **Error Handling** - Toast notifications for errors
✅ **Empty State** - Shows NullOrderList when no orders exist
✅ **Order Details** - Displays comprehensive order information
✅ **Product List** - Shows all items within each order
✅ **Payment Info** - Displays payment method and status
✅ **Responsive Design** - Maintains Tailwind styling consistency
✅ **Action Buttons** - View details and cancel options (as needed)

## Testing Checklist

- [ ] Orders load correctly on page mount
- [ ] Pagination buttons work (Trước/Sau)
- [ ] Status filter buttons update the order list
- [ ] Loading state displays during API calls
- [ ] Error toast appears on API failure
- [ ] Empty state shows when no orders available
- [ ] Order cards display all information correctly
- [ ] Currency formatting displays properly
- [ ] Status badges show with correct colors
- [ ] Product items list under each order
- [ ] Date formatting is correct (Vietnamese locale)

## Future Enhancements

- [ ] Order detail view / modal
- [ ] Order cancellation functionality
- [ ] Invoice download
- [ ] Order tracking integration
- [ ] Filter by order date range
- [ ] Order search by order number
- [ ] Shipment tracking details
