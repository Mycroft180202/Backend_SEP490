# Code Changes Summary - Quick Reference

## 1. SellerDetailModal.jsx (NEW FILE)

**Location**: `frontend/src/components/adminDashboard/SellerDetailModal.jsx`

**Size**: 213 lines

**Key Features**:
- Opens as modal when eye icon clicked
- Fetches user details from `GET /users/{userId}`
- Displays all user information
- Lock/Unlock button toggles `isActive` status
- Calls `PUT /users?userId={userId}` with body: `{ isActive: boolean, rolesId: "" }`

**Main Functions**:
```javascript
fetchSellerDetails()        // GET /users/{userId}
handleToggleStatus()        // PUT /users with status update
```

---

## 2. SellerManagement.jsx (UPDATED)

**Location**: `frontend/src/components/adminDashboard/SellerManagement.jsx`

**Changes Made**:

### Import Added:
```javascript
+ import SellerDetailModal from './SellerDetailModal';
```

### State Added:
```javascript
+ const [detailModalOpen, setDetailModalOpen] = useState(false);
+ const [selectedSeller, setSelectedSeller] = useState(null);
```

### Handlers Added:
```javascript
+ const handleViewDetails = (seller) => {
+   setSelectedSeller(seller);
+   setDetailModalOpen(true);
+ };

+ const handleCloseModal = () => {
+   setDetailModalOpen(false);
+   setSelectedSeller(null);
+ };

+ const handleStatusChange = (sellerId, newStatus) => {
+   setSellers(sellers.map(seller => 
+     seller.id === sellerId 
+       ? { ...seller, status: newStatus ? 'approved' : 'blocked' }
+       : seller
+   ));
+ };
```

### ID Column Changed:
```javascript
// BEFORE:
<td className="py-3 px-4 text-sm font-semibold text-gray-700">
  {seller.id}
</td>

// AFTER:
<td className="py-3 px-4 text-sm font-semibold text-gray-700">
  {(currentPage - 1) * pageSize + index + 1}
</td>
```

### Eye Icon Click Handler:
```javascript
// BEFORE:
<button className="text-blue-600 hover:text-blue-800" title="Xem chi tiết">
  <FaEye />
</button>

// AFTER:
<button 
  onClick={() => handleViewDetails(seller)}
  className="text-blue-600 hover:text-blue-800 transition-colors" 
  title="Xem chi tiết"
>
  <FaEye />
</button>
```

### Modal Component Added:
```javascript
+ {/* Seller Detail Modal */}
+ <SellerDetailModal
+   isOpen={detailModalOpen}
+   seller={selectedSeller}
+   onClose={handleCloseModal}
+   onStatusChange={handleStatusChange}
+ />
```

---

## 3. adminSellerService.jsx (UPDATED)

**Location**: `frontend/src/services/modules/admin/adminSellerService.jsx`

**Changes Made**:

### New Method 1: Get User Details
```javascript
+ async getUserById(userId) {
+   try {
+     const response = await axiosClient.get(`/users/${userId}`);
+     return response.data;
+   } catch (error) {
+     console.error('Error fetching user details:', error);
+     throw error;
+   }
+ },
```

### New Method 2: Update User Status
```javascript
+ async updateUserStatus(userId, isActive) {
+   try {
+     const payload = { isActive, rolesId: '' };
+     const response = await axiosClient.put('/users', payload, {
+       params: { userId },
+     });
+     return response.data;
+   } catch (error) {
+     console.error('Error updating user status:', error);
+     throw error;
+   }
+ },
```

### Removed Method: updateArtisanStatus
```javascript
- async updateArtisanStatus(userId, status) {
-   try {
-     const payload = { isActive: status === 'active' };
-     const response = await axiosClient.put(`/users/artisans/${userId}/status`, payload);
-     return response.data;
-   } catch (error) {
-     console.error('Error updating artisan status:', error);
-     throw error;
-   }
- },
```

---

## API Endpoints Used

### 1. Get Seller List (Already Existed)
```
Endpoint: GET /users/artisans
Params: ?pageIndex=1&pageSize=10
Called by: fetchSellers()
```

### 2. Get Seller Details (NEW)
```
Endpoint: GET /users/{userId}
Example: GET /users/USER-20251118-071829
Called by: SellerDetailModal
```

### 3. Update User Status (NEW)
```
Endpoint: PUT /users
Query Params: ?userId={userId}
Request Body:
{
  "isActive": true,    // or false
  "rolesId": ""        // leave empty
}
Called by: SellerDetailModal handleToggleStatus()
```

---

## Axios Request Examples

### Get User Details:
```javascript
const response = await axiosClient.get(`/users/${userId}`);
// GET https://localhost:7072/users/USER-20251118-071829
```

### Update User Status (Lock Account):
```javascript
const payload = { isActive: false, rolesId: '' };
const response = await axiosClient.put('/users', payload, {
  params: { userId: 'USER-20251118-071829' }
});
// PUT https://localhost:7072/users?userId=USER-20251118-071829
// Body: { "isActive": false, "rolesId": "" }
```

### Update User Status (Unlock Account):
```javascript
const payload = { isActive: true, rolesId: '' };
const response = await axiosClient.put('/users', payload, {
  params: { userId: 'USER-20251118-071829' }
});
// PUT https://localhost:7072/users?userId=USER-20251118-071829
// Body: { "isActive": true, "rolesId": "" }
```

---

## State Flow Diagram

```
SellerManagement Component
│
├─ sellers: []                    // List of sellers
├─ currentPage: 1                 // Current pagination page
├─ pageSize: 10                   // Items per page
├─ detailModalOpen: false         // Modal visibility (NEW)
├─ selectedSeller: null           // Selected seller (NEW)
│
├─ fetchSellers()                 // Loads sellers from API
├─ handleViewDetails()            // Opens modal (NEW)
├─ handleCloseModal()             // Closes modal (NEW)
└─ handleStatusChange()           // Updates seller status (NEW)
    │
    └─> SellerDetailModal
        │
        ├─ sellerDetails: null    // Full user details from API
        ├─ loading: false         // API loading state
        ├─ updating: false        // Status update state
        │
        ├─ fetchSellerDetails()   // GET /users/{userId}
        └─ handleToggleStatus()   // PUT /users status update
```

---

## Component Props

### SellerDetailModal Props:
```javascript
{
  isOpen: boolean,                    // Controls modal visibility
  seller: {                           // Selected seller from list
    id: string,                       // userID
    name: string,                     // displayName
    shopName: string,                 // shop name
    email: string,
    phone: string,
    revenue: number,
    status: string,
    ...
  },
  onClose: function,                  // Called when modal closes
  onStatusChange: function(id, status) // Called after status update
}
```

---

## Table Row Rendering

### BEFORE (showing userId):
```javascript
{filteredSellers.map((seller) => (
  <tr key={seller.id}>
    <td>{seller.id}</td>                    // Shows: USER-20251118-071829
    ...
  </tr>
))}
```

### AFTER (showing sequential number):
```javascript
{filteredSellers.map((seller, index) => (
  <tr key={seller.id}>
    <td>
      {(currentPage - 1) * pageSize + index + 1}  // Shows: 1, 2, 3...
    </td>
    ...
  </tr>
))}
```

---

## Toast Messages

When operations complete, user sees:

```javascript
toast.success('Đã kích hoạt tài khoản')     // When unlocking
toast.success('Đã khóa tài khoản')          // When locking
toast.error('Lỗi khi tải thông tin chi tiết') // On fetch error
toast.error('Lỗi khi cập nhật trạng thái')   // On update error
```

---

## Loading States

### Modal Opening:
```
Button click → setDetailModalOpen(true) → useEffect triggers
→ fetchSellerDetails() → setLoading(true) → API call
→ Response → setSellerDetails(data) → setLoading(false) → Display
```

### Status Update:
```
Lock button click → handleToggleStatus() → setUpdating(true)
→ API call → Success → Update state → setUpdating(false)
→ Show toast → Notify parent
```

---

## Error Handling

All API calls wrapped in try-catch-finally:

```javascript
try {
  // API call
  const response = await axiosClient.get(...);
  // Update state
  setState(response.data);
} catch (error) {
  // Log error
  console.error('Error:', error);
  // Show user feedback
  toast.error('Lỗi...');
} finally {
  // Cleanup (disable loading, etc)
  setLoading(false);
}
```

---

## Testing Commands

```bash
# Check component compiles
npm run build

# Run ESLint to find unused variables
npm run lint

# Test modal opens
1. Open browser DevTools
2. Go to Admin Dashboard → Seller Management
3. Click eye icon
4. Check Network tab for GET /users/{userId}

# Test status update
1. Click lock/unlock button in modal
2. Check Network tab for PUT /users?userId=...
3. Verify response contains updated isActive
4. Check toast notification appears
5. Close modal and verify list updated
```

