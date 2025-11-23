# Testing Guide - Seller Management Detail View & Lock/Unlock

## 📋 Pre-Testing Setup

### Prerequisites:
1. ✅ Frontend running on http://localhost:3000
2. ✅ Backend API running on https://localhost:7072
3. ✅ Admin user logged in
4. ✅ At least 2 sellers in the system

### Verify API Endpoints:
```bash
# Test GET /users/artisans endpoint
curl -X GET "https://localhost:7072/users/artisans?pageIndex=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test GET /users/{userId} endpoint
curl -X GET "https://localhost:7072/users/USER-20251118-071829" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test PUT /users endpoint
curl -X PUT "https://localhost:7072/users?userId=USER-20251118-071829" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false, "rolesId": ""}'
```

---

## 🧪 Test Case 1: View Seller Details Modal

### Steps:
1. Navigate to Admin Dashboard
2. Click on "Quản lý nghệ nhân" or Seller Management tab
3. Locate the first seller in the table
4. Click the eye icon (👁) in the "Thao tác" column

### Expected Results:
```
✅ Modal opens without lag (< 1 second)
✅ Modal title shows "Thông tin chi tiết"
✅ Close button (X) visible in top-right
✅ Loading spinner briefly shows if API is slow
✅ All user fields display:
   - User ID: [long ID string]
   - Tên đăng nhập: [username]
   - Tên hiển thị: [display name]
   - Email: [email address]
   - Số điện thoại: [phone number]
   - Ngày sinh: [formatted date]
   - Trạng thái tài khoản: [Đã kích hoạt or Bị khóa]
   - Ngày tạo tài khoản: [date]
   - Cập nhật lần cuối: [date]
   - Vai trò: [list of roles]
✅ "Đóng" and lock/unlock buttons visible at bottom
```

### Failure Indicators:
```
❌ Modal doesn't open → Check browser console for errors
❌ Blank modal → Check network tab for GET /users/{userId} response
❌ Spinning forever → API timeout or endpoint missing
❌ Missing fields → Check API response format matches expected
```

---

## 🔒 Test Case 2: Lock Active Account

### Prerequisites:
- Seller account is currently ACTIVE (status = "Đã duyệt" in list)
- Modal is open for this seller

### Steps:
1. Open detail modal for an active seller
2. Verify status shows "Đã kích hoạt" ✓
3. Verify button shows red "🔒 Khóa tài khoản"
4. Click the lock button
5. Wait for API response (should take 1-2 seconds)

### Expected Results:
```
✅ Button shows loading spinner: "🔒 [spinning] Khóa tài khoản"
✅ Button is disabled during loading
✅ Network request shows: PUT /users?userId=USER-...
✅ Request body contains: { "isActive": false, "rolesId": "" }
✅ Response status: 200 OK
✅ Response contains updated user data with "isActive": false
✅ Toast notification appears: "Đã khóa tài khoản" (bottom-right, 3 seconds)
✅ Modal status updates to "Bị khóa" ✗
✅ Button changes to green "🔓 Mở khóa"
✅ Close modal (click X or Đóng)
✅ Seller row in table updates to status "Đã khóa"
```

### Failure Indicators:
```
❌ Button doesn't respond → Check event handler attached
❌ Loading forever → API timeout or endpoint missing
❌ 404 error → Endpoint /users not found
❌ 400 error → Check request body format
❌ Status doesn't change in modal → Check response parsing
❌ List doesn't update → Check handleStatusChange callback
```

---

## 🔓 Test Case 3: Unlock Locked Account

### Prerequisites:
- Seller account is currently LOCKED (status = "Đã khóa" in list)
- Modal is open for this seller

### Steps:
1. Open detail modal for a locked seller
2. Verify status shows "Bị khóa" ✗
3. Verify button shows green "🔓 Mở khóa"
4. Click the unlock button
5. Wait for API response (should take 1-2 seconds)

### Expected Results:
```
✅ Button shows loading spinner: "🔓 [spinning] Mở khóa"
✅ Button is disabled during loading
✅ Network request shows: PUT /users?userId=USER-...
✅ Request body contains: { "isActive": true, "rolesId": "" }
✅ Response status: 200 OK
✅ Response contains updated user data with "isActive": true
✅ Toast notification appears: "Đã kích hoạt tài khoản" (bottom-right, 3 seconds)
✅ Modal status updates to "Đã kích hoạt" ✓
✅ Button changes to red "🔒 Khóa tài khoản"
✅ Close modal
✅ Seller row in table updates to status "Đã duyệt"
```

---

## 📄 Test Case 4: Sequential Number Display

### Steps:
1. View Seller Management page (page 1)
2. Check ID column for first 10 entries
3. Navigate to page 2
4. Check ID column for next 10 entries
5. Open detail modal for different sellers on different pages

### Expected Results - Page 1:
```
Row 1: ID = 1
Row 2: ID = 2
Row 3: ID = 3
...
Row 10: ID = 10
```

### Expected Results - Page 2 (with pageSize=10):
```
Row 1: ID = 11
Row 2: ID = 12
Row 3: ID = 13
...
Row 10: ID = 20
```

### Expected Results - Page 3:
```
Row 1: ID = 21
Row 2: ID = 22
...
```

### Formula Verification:
```javascript
// For page 2, index 0 (first row):
(2 - 1) * 10 + 0 + 1 = 10 + 0 + 1 = 11 ✓

// For page 2, index 5 (sixth row):
(2 - 1) * 10 + 5 + 1 = 10 + 5 + 1 = 16 ✓

// For page 3, index 0 (first row):
(3 - 1) * 10 + 0 + 1 = 20 + 0 + 1 = 21 ✓
```

### Failure Indicators:
```
❌ Numbers start from 1 on every page → Formula wrong
❌ Numbers jump incorrectly → pageSize not calculated right
❌ Modal opens for wrong seller → index calculation wrong
```

---

## 🔄 Test Case 5: Modal Lifecycle

### Steps:
1. Click eye icon to open modal
2. Wait for details to load
3. Click X button to close
4. Click eye icon again to open another seller's modal
5. Verify modal resets to empty state before loading new data

### Expected Results:
```
✅ First click: Modal opens, shows "Đang tải dữ liệu..."
✅ Data loads and displays
✅ Click X: Modal closes smoothly
✅ Click eye on different seller: Modal opens again
✅ Shows loading state before new data appears
✅ Previous seller data not visible
✅ New seller data loads correctly
✅ Can repeat multiple times without errors
```

---

## ⚠️ Test Case 6: Error Handling

### Test Case 6a: Network Error
1. Open DevTools Network tab
2. Throttle network to "Slow 3G"
3. Click eye icon
4. Network request times out

### Expected Results:
```
✅ Modal shows loading spinner (not frozen)
✅ After timeout: Error toast "Lỗi khi tải thông tin chi tiết"
✅ Modal can still be closed
✅ No console errors
```

### Test Case 6b: Invalid User ID
1. Manually set invalid userId
2. Trigger fetch

### Expected Results:
```
✅ Network request returns 404 or 400
✅ Error caught in catch block
✅ Error toast shows: "Lỗi khi tải thông tin chi tiết"
✅ Modal closes gracefully
```

### Test Case 6c: API Returns Empty/Null Fields
1. API returns user with some null fields
2. Modal loads

### Expected Results:
```
✅ Null/empty fields display as "N/A"
✅ Modal doesn't break
✅ No console errors
✅ Can still lock/unlock
```

---

## 🎨 Test Case 7: UI/UX

### Steps:
1. Open detail modal
2. Check button colors:
   - Active account: Red "🔒 Khóa tài khoản"
   - Locked account: Green "🔓 Mở khóa"
3. Hover over buttons - check hover effects
4. Check modal appearance on different screen sizes
5. Check button disabled state during loading

### Expected Results:
```
✅ Colors match design spec
✅ Buttons are clickable (not too small)
✅ Hover effects visible
✅ Modal responsive on mobile
✅ Text readable
✅ Icons display correctly
✅ Loading spinner visible
✅ Toast at correct position
```

---

## 📊 Test Case 8: Performance

### Steps:
1. Open Seller Management with 100+ sellers
2. Click eye icon multiple times
3. Lock/unlock multiple accounts
4. Monitor browser performance

### Expected Results:
```
✅ Modal opens within 1 second
✅ No noticeable lag
✅ No memory leaks
✅ Console clean (no warnings)
✅ Network requests < 5 seconds
✅ Multiple rapid clicks don't cause errors
```

---

## 🔐 Test Case 9: Security

### Verification:
1. Check UserID is only visible in modal (not in main table)
2. Verify Bearer token sent in headers
3. Check no sensitive data in console logs
4. Verify rolesId parameter sent correctly

### Expected Results:
```
✅ Main table shows sequential numbers (not userID)
✅ Network requests have Authorization header
✅ Console has only expected logs (no tokens/userIDs)
✅ rolesId field empty string in requests
```

---

## 📱 Test Case 10: Cross-Browser Testing

### Test Browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### For Each Browser:
```
✅ Modal opens and closes
✅ Details load correctly
✅ Lock/unlock works
✅ No console errors
✅ UI renders properly
✅ Buttons clickable
✅ Responsive on mobile
```

---

## 🎯 Smoke Test (Quick Check)

Run this before deployment:

```bash
# 1. Verify files exist
ls frontend/src/components/adminDashboard/SellerDetailModal.jsx
ls frontend/src/components/adminDashboard/SellerManagement.jsx
ls frontend/src/services/modules/admin/adminSellerService.jsx

# 2. Check for syntax errors
npm run lint

# 3. Build project
npm run build

# 4. Check no console errors on page load
# (Open DevTools Console in browser)

# 5. Quick functionality test
# - Open Admin Dashboard
# - Click eye icon → modal opens ✓
# - Click lock button → status updates ✓
# - Close modal → works ✓
```

---

## 📝 Test Report Template

```
Test Report - Seller Management Detail View & Lock/Unlock
========================================================

Date: _____________
Tester: _____________
Environment: Development / Staging / Production

Test Case Results:
- [ ] Test Case 1: View Details Modal ✅ / ❌
- [ ] Test Case 2: Lock Account ✅ / ❌
- [ ] Test Case 3: Unlock Account ✅ / ❌
- [ ] Test Case 4: Sequential Numbers ✅ / ❌
- [ ] Test Case 5: Modal Lifecycle ✅ / ❌
- [ ] Test Case 6: Error Handling ✅ / ❌
- [ ] Test Case 7: UI/UX ✅ / ❌
- [ ] Test Case 8: Performance ✅ / ❌
- [ ] Test Case 9: Security ✅ / ❌
- [ ] Test Case 10: Cross-Browser ✅ / ❌

Issues Found:
1. ...
2. ...

Notes:
...

Overall Status: ✅ PASS / ⚠️ NEEDS FIXES / ❌ FAIL
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All test cases pass
- [ ] No console errors
- [ ] No network errors
- [ ] Performance acceptable (< 2 second modal open)
- [ ] UI looks correct on all screen sizes
- [ ] Backend APIs tested and working
- [ ] Error handling working
- [ ] Documentation updated
- [ ] Team reviewed code
- [ ] Staging environment tested

