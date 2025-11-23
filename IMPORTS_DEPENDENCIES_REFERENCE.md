# Imports & Dependencies Reference

## SellerManagement.jsx

### Imports:
```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaCheck, FaTimes, FaBan, FaUnlock, FaSearch, FaStore, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AdminSellerService } from '../../services/modules/admin/adminSellerService';
import SellerDetailModal from './SellerDetailModal';
```

### Icons Used:
- `FaEye` - Eye icon for view details button
- `FaCheck` - Checkmark for approve button
- `FaTimes` - X mark for reject button
- `FaBan` - Ban icon for lock button
- `FaUnlock` - Unlock icon for unlock button
- `FaSearch` - Search icon in filter input
- `FaStore` - Store icon in shop name column
- `FaSpinner` - Loading spinner during data fetch

### Hooks Used:
- `useState` - For state management (sellers, currentPage, selectedSeller, detailModalOpen, etc.)
- `useEffect` - For fetching data when component mounts
- `useCallback` - For memoizing fetchSellers function

### External Libraries:
- `react-toastify` - For toast notifications

### Custom Services:
- `AdminSellerService` - API abstraction for seller operations

### Custom Components:
- `SellerDetailModal` - Modal component for showing seller details

---

## SellerDetailModal.jsx

### Imports:
```javascript
import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaSpinner, FaLock, FaUnlock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { AdminSellerService } from '../../services/modules/admin/adminSellerService';
```

### Icons Used:
- `FaTimes` - Close button (X)
- `FaSpinner` - Loading spinner
- `FaLock` - Lock icon for lock button
- `FaUnlock` - Unlock icon for unlock button

### Hooks Used:
- `useState` - For modal state (sellerDetails, loading, updating)
- `useEffect` - For fetching details when modal opens
- `useCallback` - For memoizing fetchSellerDetails

### External Libraries:
- `react-toastify` - For success/error notifications

### Custom Services:
- `AdminSellerService` - API calls for getUserById() and updateUserStatus()

---

## adminSellerService.jsx

### Imports:
```javascript
import axiosClient from '../../api/axiosConfig';
```

### Service Methods Added:

#### 1. getUserById(userId)
```javascript
/**
 * Get user details by ID
 * @param {string} userId - User ID
 * @returns {Promise} User details
 */
async getUserById(userId) {
  const response = await axiosClient.get(`/users/${userId}`);
  return response.data;
}
```

**API Endpoint**: `GET /users/{userId}`
**Example**: `GET /users/USER-20251118-071829`
**Response**: Full user object with all details

#### 2. updateUserStatus(userId, isActive)
```javascript
/**
 * Update user status (activate/deactivate)
 * @param {string} userId - User ID
 * @param {boolean} isActive - True to activate, false to deactivate
 * @returns {Promise} Updated user
 */
async updateUserStatus(userId, isActive) {
  const payload = { isActive, rolesId: '' };
  const response = await axiosClient.put('/users', payload, {
    params: { userId },
  });
  return response.data;
}
```

**API Endpoint**: `PUT /users?userId={userId}`
**Request Body**: `{ "isActive": boolean, "rolesId": "" }`
**Response**: Updated user object

---

## Package.json Dependencies

### Required Packages (Already Installed):
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^4.x.x",
    "react-toastify": "^9.x.x",
    "axios": "^1.x.x"
  }
}
```

### Verify Installation:
```bash
npm list react-icons
npm list react-toastify
npm list axios
```

---

## Axios Client Configuration

### File: `src/services/api/axiosConfig.jsx`

Expected configuration:
```javascript
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'https://localhost:7072/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Bearer token to all requests
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
```

---

## Component Dependencies Tree

```
SellerManagement.jsx
├── Imports:
│   ├── React hooks (useState, useEffect, useCallback)
│   ├── React Icons (FaEye, FaCheck, FaTimes, FaBan, FaUnlock, FaSearch, FaStore, FaSpinner)
│   ├── react-toastify (toast)
│   ├── AdminSellerService (custom service)
│   └── SellerDetailModal (custom component)
│
├── Uses:
│   ├── AdminSellerService.getArtisans() → GET /users/artisans
│   └── SellerDetailModal component
│
└── State:
    ├── sellers: array
    ├── currentPage: number
    ├── pageSize: number
    ├── detailModalOpen: boolean (NEW)
    ├── selectedSeller: object (NEW)
    └── ... other state

    ↓
    ↓ Passes props to:
    ↓

SellerDetailModal.jsx
├── Props:
│   ├── isOpen: boolean
│   ├── seller: object
│   ├── onClose: function
│   └── onStatusChange: function (callback)
│
├── Imports:
│   ├── React hooks (useState, useEffect, useCallback)
│   ├── React Icons (FaTimes, FaSpinner, FaLock, FaUnlock)
│   ├── react-toastify (toast)
│   └── AdminSellerService (custom service)
│
├── Uses:
│   ├── AdminSellerService.getUserById() → GET /users/{userId}
│   └── AdminSellerService.updateUserStatus() → PUT /users?userId=...
│
└── State:
    ├── sellerDetails: object
    ├── loading: boolean
    └── updating: boolean
```

---

## Tailwind CSS Classes Used

### SellerDetailModal.jsx:
```css
/* Layout */
fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50
bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto

/* Header */
flex items-center justify-between p-6 border-b border-gray-200
text-lg font-bold text-gray-800

/* Content */
p-6 space-y-4 (gap between items)
block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2

/* Status Indicator */
px-3 py-1 rounded-full text-xs font-semibold
bg-green-100 text-green-800 (active)
bg-red-100 text-red-800 (locked)

/* Forms/Inputs */
text-sm bg-gray-100 p-2 rounded border border-gray-200
text-sm font-semibold

/* Buttons */
px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50
px-4 py-2 rounded-lg font-semibold text-sm text-white
bg-red-600 hover:bg-red-700 (lock button - active)
bg-green-600 hover:bg-green-700 (unlock button - locked)
flex items-center gap-2
disabled:opacity-50 disabled:cursor-not-allowed

/* Footer */
px-6 py-4 border-t border-gray-200 flex gap-2 justify-end
```

### SellerManagement.jsx:
```css
/* Stats Cards */
bg-white rounded-lg shadow p-4 border-l-4
border-blue-500 (total)
border-green-500 (approved)
border-yellow-500 (pending)
border-red-500 (blocked)
border-purple-500 (revenue)

/* Main Container */
space-y-6 (vertical spacing)
bg-white rounded-xl shadow-md p-6

/* Filters */
grid grid-cols-1 md:grid-cols-3 gap-4
relative md:col-span-2
w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
focus:outline-none focus:ring-2 focus:ring-primary

/* Table */
overflow-x-auto
w-full
border-b border-gray-200 hover:bg-gray-50

/* Buttons (Action Row) */
flex gap-2
text-blue-600 hover:text-blue-800 transition-colors (eye icon)
text-green-600 hover:text-green-800 (approve/unlock)
text-red-600 hover:text-red-800 (reject/lock)

/* Pagination */
mt-6 flex items-center justify-between
px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50
bg-primary text-white (active page)
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## Error Handling Pattern

All API calls wrapped in try-catch-finally:

```javascript
try {
  // API call
  const response = await axiosClient.get(url);
  // Process response
  setState(response.data);
} catch (error) {
  // Log error
  console.error('Error message:', error);
  // Notify user
  toast.error('User-friendly error message');
  // Re-throw if needed
  throw error;
} finally {
  // Cleanup
  setLoading(false);
  setUpdating(false);
}
```

---

## State Management Pattern

### SellerManagement.jsx:
```javascript
// Fetch data
const fetchSellers = useCallback(async () => {
  setLoading(true);
  try {
    // API call
    const response = await AdminSellerService.getArtisans(...);
    // Update state
    setSellers(transformedData);
  } catch (error) {
    toast.error('Error message');
  } finally {
    setLoading(false);
  }
}, [dependencies]);

// Use effect to trigger fetch
useEffect(() => {
  fetchSellers();
}, [fetchSellers]);
```

### SellerDetailModal.jsx:
```javascript
// Fetch details when modal opens
const fetchSellerDetails = useCallback(async () => {
  setLoading(true);
  try {
    const details = await AdminSellerService.getUserById(seller.id);
    setSellerDetails(details);
  } catch (error) {
    toast.error('Error message');
  } finally {
    setLoading(false);
  }
}, [seller.id]);

// Trigger fetch when modal opens
useEffect(() => {
  if (isOpen && seller) {
    fetchSellerDetails();
  }
}, [isOpen, seller, fetchSellerDetails]);
```

---

## Constants & Defaults

### Default Values:
```javascript
const pageSize = 10;                    // Default items per page
const currentPage = 1;                  // Start at page 1
const searchTerm = '';                  // No search by default
const filterStatus = 'all';             // Show all statuses
const sortBy = '';                      // No sorting
const sortOrder = 'asc';                // Ascending order

const detailModalOpen = false;          // Modal closed by default
const selectedSeller = null;            // No seller selected
```

### Status Values:
```javascript
'approved'      // Green, can lock
'pending'       // Yellow, can approve/reject
'blocked'       // Red, can unlock
'suspended'     // Red, can unlock (same as blocked)
'inactive'      // Gray, disabled
```

---

## Console Logging (For Debugging)

### In SellerManagement.jsx:
```javascript
console.error('Error fetching sellers:', error);
```

### In SellerDetailModal.jsx:
```javascript
console.error('Error fetching user details:', error);
console.error('Error updating user status:', error);
```

### In AdminSellerService.jsx:
```javascript
console.error('Error fetching user:', error);
console.error('Error updating user status:', error);
```

Remove these logs in production or use a logger library.

---

## Browser DevTools Debugging

### To inspect state:
1. React DevTools → Components tab
2. Search for "SellerManagement" or "SellerDetailModal"
3. Click component to see props and state

### To inspect network:
1. DevTools → Network tab
2. Filter by "XHR" (XMLHttpRequest)
3. Look for GET /users, PUT /users requests

### To inspect errors:
1. DevTools → Console tab
2. Look for any red error messages
3. Click to see full error stack trace

---

## Performance Optimization

### useCallback Dependencies:
```javascript
// SellerManagement.jsx
const fetchSellers = useCallback(async () => {
  // ...
}, [currentPage, pageSize, searchTerm, sortBy, sortOrder]);

// SellerDetailModal.jsx
const fetchSellerDetails = useCallback(async () => {
  // ...
}, [seller.id]);
```

### useEffect Dependencies:
```javascript
// SellerManagement.jsx
useEffect(() => {
  fetchSellers();
}, [fetchSellers]);

// SellerDetailModal.jsx
useEffect(() => {
  if (isOpen && seller) {
    fetchSellerDetails();
  }
}, [isOpen, seller, fetchSellerDetails]);
```

---

## Version Compatibility

### React:
- Requires React 16.8+ (for hooks)
- Tested with React 18.2.0

### React Icons:
- Version 4.x or higher
- Icon names prefixed with "Fa" (Font Awesome)

### React Toastify:
- Version 9.x or higher
- toast.success(), toast.error() functions

### Axios:
- Version 1.x or higher
- axiosClient interceptors supported

---

## Import Path Resolution

### Relative Imports:
```javascript
// From adminDashboard folder to services
import { AdminSellerService } from '../../services/modules/admin/adminSellerService';

// From adminDashboard folder to same folder
import SellerDetailModal from './SellerDetailModal';
```

### Path Structure:
```
frontend/src/
├── components/
│   └── adminDashboard/
│       ├── SellerManagement.jsx        (imports from here)
│       └── SellerDetailModal.jsx       (imports from here)
├── services/
│   ├── api/
│   │   └── axiosConfig.jsx
│   └── modules/
│       └── admin/
│           └── adminSellerService.jsx  (imported by above)
```

