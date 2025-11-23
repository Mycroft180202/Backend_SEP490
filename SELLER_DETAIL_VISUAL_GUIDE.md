# Seller Management - Visual Summary

## Before vs After

### BEFORE:
```
ID Column          | Nghệ nhân      | Cửa hàng | Liên hệ | Doanh thu | Trạng thái | Thao tác
USER-20251118-071829 | Trần Đình Khánh | N/A     | ...    | 0 ₫      | approved   | 👁
USER-20251118-071830 | Trần Văn A     | N/A     | ...    | 0 ₫      | approved   | 👁
```

### AFTER:
```
ID  | Nghệ nhân      | Cửa hàng | Liên hệ | Doanh thu | Trạng thái | Thao tác
 1  | Trần Đình Khánh | N/A     | ...    | 0 ₫      | approved   | 👁
 2  | Trần Văn A     | N/A     | ...    | 0 ₫      | approved   | 👁
```

---

## New Features Added

### 1️⃣ Eye Icon Click (👁) → Opens Detail Modal

```
┌─────────────────────────────────────────────┐
│  Thông tin chi tiết                      ❌  │
├─────────────────────────────────────────────┤
│                                              │
│  User ID:                                   │
│  [USER-20251118-071829]                     │
│                                              │
│  Tên đăng nhập:                             │
│  Artisan1                                    │
│                                              │
│  Tên hiển thị:                              │
│  Trần Đình Khánh                            │
│                                              │
│  Email:                                     │
│  tdkhanhx1805@gmail.com                     │
│                                              │
│  Số điện thoại:                             │
│  0393020000                                 │
│                                              │
│  Ngày sinh:                                 │
│  05/12/2002                                 │
│                                              │
│  Trạng thái tài khoản:                      │
│  [Đã kích hoạt]  ✓                          │
│                                              │
│  Ngày tạo tài khoản:                        │
│  18/11/2025                                 │
│                                              │
│  Cập nhật lần cuối:                         │
│  18/11/2025                                 │
│                                              │
│  Vai trò:                                   │
│  ┌────────────────────────────────────┐    │
│  │ Artisan                            │    │
│  │ Nghệ nhân bán sản phẩm.            │    │
│  └────────────────────────────────────┘    │
│  ┌────────────────────────────────────┐    │
│  │ Customer                           │    │
│  │ Người dùng bình thường.            │    │
│  └────────────────────────────────────┘    │
│                                              │
├─────────────────────────────────────────────┤
│  [Đóng]    [🔒 Khóa tài khoản]              │
└─────────────────────────────────────────────┘
```

### 2️⃣ Lock/Unlock Account (🔒/🔓)

**When Account is ACTIVE:**
```
Status: [Đã kích hoạt] ✓
Button: [🔒 Khóa tài khoản] (red)
```

**When Account is LOCKED:**
```
Status: [Bị khóa] ✗
Button: [🔓 Mở khóa] (green)
```

**Click Lock Button → API Call:**
```
PUT /users?userId=USER-20251118-071829
Body:
{
  "isActive": false,
  "rolesId": ""
}

✓ Success → Toast: "Đã khóa tài khoản"
✓ Updates modal status
✓ Updates seller list row
```

---

## Implementation Architecture

```
SellerManagement.jsx
├── State
│   ├── sellers (array)
│   ├── currentPage (number)
│   ├── detailModalOpen (boolean)  ← NEW
│   └── selectedSeller (object)    ← NEW
│
├── Handlers
│   ├── fetchSellers() - loads from API
│   ├── handleViewDetails(seller)  ← NEW
│   ├── handleCloseModal()         ← NEW
│   └── handleStatusChange()       ← NEW
│
└── Render
    ├── Stats Cards
    ├── Filters & Search
    ├── Table
    │   └── Eye Button → opens modal
    └── Modal (SellerDetailModal) ← NEW
        ├── Fetches /users/{userId}
        ├── Shows all user details
        └── Lock/Unlock Button
            └── Calls updateUserStatus()
```

---

## Sequential Number Calculation

```javascript
// Row position in current view
{(currentPage - 1) * pageSize + index + 1}

// Example:
// Page 1, pageSize=10, index=0 → (0) * 10 + 0 + 1 = 1
// Page 1, pageSize=10, index=9 → (0) * 10 + 9 + 1 = 10
// Page 2, pageSize=10, index=0 → (1) * 10 + 0 + 1 = 11
// Page 2, pageSize=10, index=9 → (1) * 10 + 9 + 1 = 20
```

---

## API Flow Diagram

```
User clicks Eye Icon
        ↓
handleViewDetails(seller)
        ↓
setDetailModalOpen(true)
setSelectedSeller(seller)
        ↓
SellerDetailModal mounts
        ↓
AdminSellerService.getUserById(seller.id)
        ↓
GET /users/USER-20251118-071829
        ↓
Response with full user data
        ↓
Modal displays all fields
        ↓
User clicks Lock/Unlock
        ↓
AdminSellerService.updateUserStatus(userId, isActive)
        ↓
PUT /users?userId=USER-20251118-071829
Body: { isActive: false, rolesId: "" }
        ↓
Success response
        ↓
Update modal display
Update seller list row
Show toast notification
```

---

## Files Modified

```
frontend/src/
├── components/
│   └── adminDashboard/
│       ├── SellerManagement.jsx          (UPDATED)
│       └── SellerDetailModal.jsx         (NEW ✅)
│
├── services/
│   └── modules/
│       └── admin/
│           └── adminSellerService.jsx    (UPDATED)
```

---

## Test Scenarios

### Scenario 1: View Seller Details
```
1. Navigate to Admin Dashboard → Seller Management
2. Click 👁 icon on any row
3. ✓ Modal opens
4. ✓ All user details load
5. ✓ UserID visible (copy-paste friendly format)
6. ✓ Close button works
```

### Scenario 2: Lock Active Account
```
1. Click 👁 on active seller
2. Modal shows "Đã kích hoạt" status
3. See red [🔒 Khóa tài khoại] button
4. Click lock button
5. ✓ Button disabled during API call (shows spinner)
6. ✓ Status changes to "Bị khóa"
7. ✓ Button changes to green [🔓 Mở khóa]
8. ✓ Toast: "Đã khóa tài khoản"
9. ✓ Close modal
10. ✓ Seller list row status updated to "Đã khóa"
```

### Scenario 3: Unlock Locked Account
```
1. Click 👁 on locked seller
2. Modal shows "Bị khóa" status
3. See green [🔓 Mở khóa] button
4. Click unlock button
5. ✓ Status changes to "Đã kích hoạt"
6. ✓ Button changes to red [🔒 Khóa tài khoản]
7. ✓ Toast: "Đã kích hoạt tài khoản"
8. ✓ Seller list updated
```

### Scenario 4: Pagination with Sequential Numbers
```
1. View page 1: Shows 1, 2, 3... 10
2. Navigate to page 2
3. ✓ Shows 11, 12, 13... 20
4. View details of item #15
5. ✓ Correctly identifies seller from page 2
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal doesn't open | Check browser console for errors in `handleViewDetails` |
| Details don't load | Verify `/users/{userId}` endpoint exists and returns data |
| Lock button not working | Check `PUT /users?userId={userId}` endpoint and request body |
| Status not updating in list | Ensure `handleStatusChange` is called and updating state |
| Sequential numbers wrong | Verify `pageSize` and `currentPage` state values |
| Modal appears blank | Check network tab for API errors in DevTools |

---

## Performance Notes

✅ **Optimized**:
- Modal only fetches user details when opened (lazy loading)
- useCallback with proper dependencies prevents unnecessary re-renders
- Seller list updates efficiently with map/filter

⚠️ **Could Improve**:
- Add caching for frequently viewed sellers
- Implement search debouncing for large lists
- Virtual scrolling for 100+ sellers

