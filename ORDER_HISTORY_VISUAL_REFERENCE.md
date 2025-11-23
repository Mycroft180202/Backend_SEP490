# Order History Page - Visual Reference

## 📱 UI Layout Diagram

```
┌─ ORDER HISTORY PAGE ──────────────────────────────────────┐
│                                                            │
│  ┌─ HEADER ─────────────────────────────────────────────┐ │
│  │ Logo  Navigation  Profile  Cart                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ SORT BAR (Status Filter) ───────────────────────────┐ │
│  │  [Tất cả]  [Chờ thanh toán]  [Đã thanh toán]        │ │
│  │   ↓ selected tab has border-bottom and text-primary  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ ORDER LIST ──────────────────────────────────────────┐ │
│  │                                                        │ │
│  │  ┌─ ORDER CARD 1 ─────────────────────────────────┐  │ │
│  │  │ ORDER-001        ┌─ [Yellow] Chờ thanh toán ┐ │  │ │
│  │  │ 21/11/2025 20:54 │ Pending Status Badge      │ │  │ │
│  │  │ ─────────────────┴──────────────────────────┘ │  │ │
│  │  │ Thanh toán: COD              Tổng: 105.500đ  │  │ │
│  │  │ ─────────────────────────────────────────────── │  │ │
│  │  │ Chi tiết sản phẩm                             │  │ │
│  │  │ ─────────────────────────────────────────────── │  │ │
│  │  │ Sản phẩm 1                                    │  │ │
│  │  │ Mã: PROD-001 | Số lượng: 2                    │  │ │
│  │  │ Đơn giá: 50.000đ         Thành tiền: 100.000đ│  │ │
│  │  │ ─────────────────────────────────────────────── │  │ │
│  │  │ Sản phẩm 2                                    │  │ │
│  │  │ Mã: PROD-002 | Số lượng: 1                    │  │ │
│  │  │ Đơn giá: 5.500đ          Thành tiền: 5.500đ  │  │ │
│  │  │ ─────────────────────────────────────────────── │  │ │
│  │  │ [Xem chi tiết]  [Hủy đơn]                      │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  │  ┌─ ORDER CARD 2 ─────────────────────────────────┐  │ │
│  │  │ ORDER-002        ┌─ [Green] Đã thanh toán ──┐ │  │ │
│  │  │ 20/11/2025 15:30 │ Paid Status Badge        │ │  │ │
│  │  │ ─────────────────┴──────────────────────────┘ │  │ │
│  │  │ Thanh toán: VNPAY            Tổng: 250.000đ  │  │ │
│  │  │ ─────────────────────────────────────────────── │  │ │
│  │  │ Chi tiết sản phẩm                             │  │ │
│  │  │ ─────────────────────────────────────────────── │  │ │
│  │  │ Sản phẩm 1                                    │  │ │
│  │  │ Mã: PROD-003 | Số lượng: 5                    │  │ │
│  │  │ Đơn giá: 50.000đ         Thành tiền: 250.000đ│  │ │
│  │  │ ─────────────────────────────────────────────── │  │ │
│  │  │ [Xem chi tiết]                                 │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  │  ┌─ PAGINATION CONTROLS ──────────────────────────┐  │ │
│  │  │  [< Trước]  Trang 1/6  [Sau >]                │  │ │
│  │  │   disabled           enabled                   │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌─ FOOTER ─────────────────────────────────────────────┐ │
│  │ Company Info  Contact  Social Links  Copyright       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## 🎨 Status Badge Styling

```
┌─ PENDING (Chờ thanh toán) ────┐
│ Background: #FFF3CD (Yellow)   │
│ Text: #856404 (Dark Yellow)    │
│ Label: "Chờ thanh toán"        │
│ Padding: px-3 py-1            │
│ Border-radius: rounded-lg      │
└────────────────────────────────┘

┌─ PAID (Đã thanh toán) ─────────┐
│ Background: #D4EDDA (Green)    │
│ Text: #155724 (Dark Green)     │
│ Label: "Đã thanh toán"         │
│ Padding: px-3 py-1            │
│ Border-radius: rounded-lg      │
└────────────────────────────────┘
```

## 🔄 State Flow Diagram

```
       User visits page
            ↓
    OrderHistory mounted
            ↓
    useEffect calls fetchOrders(1)
            ↓
    ┌─────────────────────────────┐
    │ loading = true              │
    │ Show: "Đang tải..."         │
    └─────────────────────────────┘
            ↓
    API call starts
            ↓
   ┌────────────────────────────────────┐
   │ GET /api/Order/my-orders           │
   │   ?pageIndex=1&pageSize=10         │
   └────────────────────────────────────┘
            ↓
    ┌──────────────────────────────────┐
    │ API Success?                     │
    └──────────────────────────────────┘
        /                    \
       /                      \
    YES                        NO
     │                          │
     ↓                          ↓
  Filter by        toast.error('Không thể
  selectedStatus   tải...')
     │              │
     ↓              ↓
  setOrders()    Clear orders
     │              │
     ↓              ↓
  loading=false   loading=false
     │              │
     ↓              ↓
  ┌──────────────┐  ┌──────────────┐
  │ Show orders  │  │ Show error   │
  │ & pagination │  │ & empty list │
  └──────────────┘  └──────────────┘
        ↓                  ↓
    User sees orders   User sees error
```

## 🔗 Component Dependency Tree

```
OrderHistory
├── imports
│   ├── React hooks (useState, useEffect, useCallback)
│   ├── OrderService (getMyOrders method)
│   ├── toast (react-toastify)
│   ├── Header
│   ├── Footer
│   ├── SortBar
│   ├── OrderList
│   └── NullOrderList
│
├── state
│   ├── orders: Order[]
│   ├── loading: boolean
│   ├── selectedStatus: string
│   ├── currentPage: number
│   ├── pageSize: number
│   └── totalPages: number
│
├── callbacks
│   └── fetchOrders(pageIndex)
│       └── calls OrderService.getMyOrders()
│
├── handlers
│   ├── handleStatusChange(status)
│   ├── handleNextPage()
│   └── handlePreviousPage()
│
└── render
    ├── Header
    ├── SortBar
    │   └── triggers handleStatusChange
    ├── conditional rendering
    │   ├── if loading → <LoadingUI />
    │   ├── else if orders.length > 0 → <OrderList />
    │   └── else → <NullOrderList />
    ├── conditional pagination
    │   └── if totalPages > 1 → <PaginationButtons />
    └── Footer
```

## 📊 API Response Processing Flow

```
Raw API Response
    ↓
{
  items: Order[],
  totalCount: number,
  pageIndex: number,
  pageSize: number,
  totalPages: number,
  hasNextPage: boolean,
  hasPreviousPage: boolean
}
    ↓
Extract items[]
    ↓
┌────────────────────────────────┐
│ if (selectedStatus !== 'all')  │
│   filter by status             │
│ else                           │
│   use all items                │
└────────────────────────────────┘
    ↓
Apply filtering
    ↓
filteredItems: Order[]
    ↓
setOrders(filteredItems)
    ↓
Set pagination
    ├── setTotalPages(response.totalPages)
    ├── setCurrentPage(pageIndex)
    └── Update state
    ↓
Render OrderList
    ↓
OrderList.map(orders)
    ↓
For each order, render OrderCard
    ↓
OrderCard renders:
├── Order Header (number, date, status, payment, total)
├── ProductItem[] (one for each item in order.items)
└── Action Buttons
```

## 🎯 User Interaction Paths

### Path 1: Change Status Filter
```
User clicks "Chờ thanh toán"
         ↓
  SortBar.onClick
         ↓
  handleClick(idx, 'Pending')
         ↓
  handleStatusChange('Pending')
         ↓
  setSelectedStatus('Pending')
         ↓
  fetchOrders callback triggers
         ↓
  Filter orders by 'Pending' status
         ↓
  Display filtered orders
```

### Path 2: Navigate to Next Page
```
User clicks "Sau" (Next) button
         ↓
  handleNextPage()
         ↓
  if (currentPage < totalPages)
         ↓
  fetchOrders(currentPage + 1)
         ↓
  API call with pageIndex=2
         ↓
  Response with page 2 orders
         ↓
  setCurrentPage(2)
         ↓
  Display page 2 orders
```

### Path 3: Handle API Error
```
API call fails
         ↓
  catch(error)
         ↓
  console.error(error)
         ↓
  toast.error('Không thể tải...')
         ↓
  finally setLoading(false)
         ↓
  Show error message to user
         ↓
  User can retry by clicking filter
```

## 📐 Spacing & Layout Metrics

```
Page Container
├── Padding X: px-[144px] (both sides)
├── Padding Y: py-6 (SortBar)
│
Order List
├── Gap between cards: gap-6
├── Padding: pt-6 pb-[120px] px-[144px]
│
Order Card
├── Width: w-full max-w-[1152px]
├── Padding: px-6 py-4
├── Border: border border-gray-200
├── Radius: rounded-lg
│
Product Item
├── Padding: py-3 px-4
├── Border-bottom: except last item
│
Status Badge
├── Padding: px-3 py-1
├── Font: text-sm font-semibold
├── Radius: rounded-lg
```

## 🎨 Color Palette

```
Primary Colors
├── Primary: #9e211f (text-primary)
│
Status Colors
├── Pending: #FFF3CD (bg) + #856404 (text)
├── Paid: #D4EDDA (bg) + #155724 (text)
│
Neutral Colors
├── Gray-50: #F9FAFB (bg-gray-50)
├── Gray-100: #F3F4F6
├── Gray-200: #E5E7EB (border)
├── Gray-300: #D1D5DB
├── Gray-500: #6B7280
├── Gray-600: #4B5563
├── Gray-700: #374151
├── Gray-800: #1F2937
│
Semantic Colors
├── Success: #22C55E (green-600)
├── Error: #EF4444 (red-500)
├── Warning: #FBBF24 (amber-400)
```

## 📱 Responsive Breakpoints

```
Mobile (< 640px)
├── Padding reduced to px-4
├── Cards stack vertically
├── Font sizes slightly smaller
├── Pagination single line

Tablet (640px - 1024px)
├── Standard padding px-8
├── Cards in 1 column
├── Full feature visibility
├── Pagination standard

Desktop (> 1024px)
├── Max padding px-[144px]
├── Cards max-width 1152px
├── All features visible
├── Pagination standard
```

---

**This visual reference should help understand the order history page layout, styling, and user interactions.**
