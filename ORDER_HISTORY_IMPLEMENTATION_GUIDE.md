# Order History Page - Implementation Guide

## Quick Summary

The Order History page has been successfully refactored to use the new `/api/Order/my-orders` API endpoint. The page now displays real user orders with pagination, status filtering, and a modern UI.

## What Changed

### ❌ Before (Mock Data)
```javascript
// Static mock data
const ORDERS = [
  { shopName, productName, price, shipFee, total, status: "unpaid" },
  { shopName, productName, price, shipFee, total, status: "shipping" }
];
```

### ✅ After (Real API)
```javascript
// Dynamic data from API
const response = await OrderService.getMyOrders(pageIndex, pageSize);
// Returns: { items[], totalCount, pageIndex, pageSize, totalPages }
```

## Files Modified

1. **`frontend/src/pages/OrderHistory.jsx`** (118 lines)
   - Added API integration with useCallback
   - Added pagination logic
   - Added status filtering
   - Added loading and error states

2. **`frontend/src/components/orderHistory/OrderList.jsx`** (117 lines)
   - Redesigned from product-card to order-card layout
   - Added StatusBadge component
   - Added ProductItem component
   - Added OrderCard component
   - Added order action buttons

3. **`frontend/src/components/orderHistory/SortBar.jsx`** (38 lines)
   - Updated status list to match API values (all, Pending, Paid)
   - Simplified styling
   - Removed unnecessary images

4. **`frontend/src/services/modules/orders/orderService.jsx`** (Already updated)
   - Contains getMyOrders() method

5. **`frontend/src/utils/formatCurrency.js`** (NEW)
   - Centralized currency formatting utility

## How to Test

### Test 1: Initial Load
1. Navigate to `/order-history`
2. Expected: Page loads with loading indicator
3. Expected: Orders appear once API responds
4. Expected: Page number and pagination buttons show if totalPages > 1

### Test 2: Status Filter
1. Click "Chờ thanh toán" button
2. Expected: Orders list updates to show only Pending status
3. Click "Đã thanh toán" button
4. Expected: Orders list updates to show only Paid status
5. Click "Tất cả" button
6. Expected: Orders list shows all orders

### Test 3: Pagination
1. If totalPages > 1, click "Sau" (Next) button
2. Expected: Page increments and orders update
3. Expected: "Trước" (Previous) button becomes enabled
4. Click "Trước" button
5. Expected: Page decrements and orders update
6. Expected: "Sau" button remains enabled unless on last page

### Test 4: Order Display
1. Verify each order card shows:
   - ✓ Order number (e.g., "ORDER-20251121-205419359")
   - ✓ Order date and time
   - ✓ Status badge (yellow for Pending, green for Paid)
   - ✓ Payment type (COD or VNPAY)
   - ✓ Total amount formatted as currency
   - ✓ Product items with quantity and price
   - ✓ Action buttons (View details, Cancel if Pending)

### Test 5: Empty State
1. If no orders exist
2. Expected: NullOrderList shows
3. Expected: Icon and "Chưa có đơn hàng nào" message

### Test 6: Error Handling
1. Manually disable network or API
2. Expected: Error toast notification appears
3. Expected: Error logged to console
4. Expected: Page gracefully handles error

## API Response Example

```javascript
GET /api/Order/my-orders?pageIndex=1&pageSize=10

Response:
{
  "items": [
    {
      "orderNumber": "ORDER-20251121-205419359",
      "customerId": "USER-20251118-072457",
      "status": "Pending",
      "paymentType": "COD",
      "totalAmount": 105500,
      "createAt": "2025-11-21T20:54:19.36127Z",
      "items": [
        {
          "productID": "PROD-20251118-123456",
          "quantity": 2,
          "unitPrice": 50000
        }
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

## Component Structure

```
<OrderHistory>
  ├─ <Header />
  ├─ <SortBar onStatusChange={handleStatusChange} />
  ├─ {loading ? 
  │    <LoadingUI /> :
  │    orders.length > 0 ? 
  │      <OrderList orders={orders} /> :
  │      <NullOrderList />
  │  }
  ├─ {totalPages > 1 && <PaginationControls />}
  └─ <Footer />
</OrderHistory>
```

## Key Features

| Feature | Status | Notes |
|---------|--------|-------|
| Load orders from API | ✅ | Uses OrderService.getMyOrders() |
| Pagination | ✅ | Previous/Next buttons with page indicator |
| Status filtering | ✅ | All/Pending/Paid with visual indicator |
| Loading state | ✅ | Shows "Đang tải..." during fetch |
| Error handling | ✅ | Toast notifications on failure |
| Empty state | ✅ | NullOrderList when no orders |
| Order display | ✅ | Full order info with nested products |
| Currency formatting | ✅ | Vietnamese locale with 'đ' suffix |
| Responsive design | ✅ | Matches design system |

## Known Limitations & Future Work

### Current Limitations
- Status filter shows 3 options (All/Pending/Paid), but backend may support more statuses
- No order detail modal yet (View Details button is placeholder)
- Cancel order button is placeholder (needs API endpoint)
- No shipment tracking details shown

### Future Enhancements
- [ ] Click order to see full details in modal
- [ ] Implement order cancellation
- [ ] Add shipment tracking view
- [ ] Invoice download functionality
- [ ] Order date range filter
- [ ] Search by order number
- [ ] Export orders to CSV
- [ ] Retry/Refund options for failed payments

## Troubleshooting

### Orders not loading?
- Check browser console for API errors
- Verify token is being sent (check axios interceptor)
- Confirm `/api/Order/my-orders` endpoint exists
- Check network tab for failed requests

### Status filter not working?
- Verify status values match API (Pending, Paid)
- Check that selectedStatus state is updating
- Verify statusMap object is correct

### Pagination not appearing?
- Check if totalPages > 1
- Verify API returns pagination data
- Check console for any errors

### Currency displaying incorrectly?
- Verify formatCurrency import
- Check that values are numbers, not strings
- Browser locale should be set to vi-VN

## Dependencies

```javascript
// External
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

// Internal
import { OrderService } from '../services/modules/orders/orderService';
import { formatCurrency } from '../../utils/formatCurrency';
```

## Performance Notes

- Uses `useCallback` to optimize refetch function
- Pagination reduces data loaded per request (10 items/page)
- Status filtering done client-side after fetch
- No unnecessary re-renders (dependencies managed)

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- Requires fetch/async-await support
- Tailwind CSS v3.x

## Related Pages

- `/order-tracking` - Track shipment of orders
- `/checkout` - Place new orders
- `/product-detail/:id` - View product details

## Support

For issues or questions:
1. Check browser console for errors
2. Review network requests in DevTools
3. Verify API response format matches documentation
4. Check localStorage for auth token
