# Order History Page - Component Architecture

## Component Hierarchy

```
OrderHistory (Page)
├── Header
├── SortBar
│   └── Status Filter Buttons
│       ├── Tất cả (all)
│       ├── Chờ thanh toán (Pending)
│       └── Đã thanh toán (Paid)
├── OrderList (or NullOrderList if empty)
│   └── OrderCard[] (For each order)
│       ├── StatusBadge
│       ├── Order Header Info
│       │   ├── Order Number
│       │   ├── Order Date
│       │   ├── Status Badge
│       │   ├── Payment Type
│       │   └── Total Amount
│       ├── ProductItem[] (For each item in order)
│       │   ├── Product ID
│       │   ├── Quantity
│       │   ├── Unit Price
│       │   └── Subtotal
│       └── Action Buttons
│           ├── View Details
│           └── Cancel Order (if Pending)
└── Footer
```

## Data Flow

```
OrderHistory Page
    ↓
useCallback(fetchOrders)
    ↓
OrderService.getMyOrders(pageIndex, pageSize)
    ↓
GET /api/Order/my-orders?pageIndex&pageSize
    ↓
Backend API Response
    ↓
Filter by selectedStatus (if not 'all')
    ↓
setOrders(filteredItems)
    ↓
OrderList Component
    ↓
OrderCard[] Components
    ↓
render Order Information
```

## State Management

### OrderHistory.jsx State
```javascript
{
  orders: [],                    // Array of order objects
  loading: false,                // Loading state during API call
  selectedStatus: 'all',         // Current status filter
  currentPage: 1,                // Current pagination page
  pageSize: 10,                  // Items per page
  totalPages: 0                  // Total available pages
}
```

### SortBar.jsx State
```javascript
{
  selected: 0                    // Index of selected status filter
}
```

## Key Functions

### OrderHistory.fetchOrders(pageIndex)
- Fetches orders from API using OrderService.getMyOrders()
- Filters results by selectedStatus
- Updates state with orders, totalPages, currentPage
- Shows error toast if API call fails

### SortBar.handleClick(idx, key)
- Updates selected status filter
- Triggers onStatusChange callback
- OrderHistory resets to page 1 and refetches

### OrderList Display
- Maps orders array to OrderCard components
- Each OrderCard displays one order with nested product items
- Uses formatCurrency utility for price display

## API Status Values vs Display

The component maps between API status values and user-friendly Vietnamese labels:

```
API Value  →  Display Label
─────────────────────────────
all        →  Tất cả (No filter)
Pending    →  Chờ thanh toán (Yellow badge)
Paid       →  Đã thanh toán (Green badge)
```

## Responsive Layout

All components use fixed padding `px-[144px]` for consistency with the design system:
- OrderHistory: max-width container with flex layout
- OrderList: flex column with gap-6 spacing
- OrderCard: full width with max-width 1152px
- StatusBadge: inline with text

## Color Scheme

```
Status Badge Colors:
├── Pending: #FFF3CD (bg) + #856404 (text)
├── Paid: #D4EDDA (bg) + #155724 (text)
└── Default: #E2E3E5 (bg) + #383D41 (text)

Button Colors:
├── Primary: text-primary (red/brown)
├── Hover: hover:bg-gray-100
└── Disabled: opacity-50 cursor-not-allowed
```

## Pagination Logic

```
currentPage = 1, totalPages = 6
┌─ Button: Trước (Previous)
│  disabled when currentPage === 1
├─ Display: "Trang 1/6"
└─ Button: Sau (Next)
   disabled when currentPage === totalPages

On button click:
- fetchOrders(currentPage ± 1)
- Updates currentPage in state
- Updates orders list
```

## Loading and Error States

```
Loading State (during API call):
├── Shows: <p>Đang tải...</p>
└── Hides: OrderList and pagination

Empty State (no orders):
├── Shows: <NullOrderList />
│   └── Icon + "Chưa có đơn hàng nào"
└── Hides: OrderList and pagination

Error State (API failure):
├── Shows: Toast notification
├── Logs: Error to console
└── Displays: Previous data or NullOrderList
```

## Currency Formatting

Uses Vietnamese locale with 'đ' suffix:
```
50000        →  50.000đ
105500       →  105.500đ
2500000      →  2.500.000đ
```

Implemented via: `formatCurrency(value, 'đ')`
