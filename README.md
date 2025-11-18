# Backend_SEP490 – Full API Flow & Usage Guide

## 1. Authentication & Accounts
- `POST /api/Auth/register` – body `RequestDTORegister` (includes OTP send + verify).
- `POST /api/Auth/login` – returns `{ accessToken, refreshToken }`.
- `POST /api/Auth/refresh`, `/logout` for token rotation.
- Password recovery: `/forgot-password`, `/reset-password`, `/verify-otp`, `/resend-otp`.
- Always send `Authorization: Bearer <accessToken>` for authenticated routes.

## 2. User Profile & Addresses
- `GET /api/User/me`, `PUT /api/User/me` – basic profile CRUD.
- Admin search/filter: `POST /api/User/search`, `GET /api/User/{id}` etc.
- Addresses (`/api/Address`):
  - Body `RequestCreateAndUpdateAddress` MUST include `ContactName`, `ContactPhone`, `GhnProvinceId`, `GhnDistrictId`, `GhnWardCode` so GHN metadata is stored once.

## 3. Catalog Modules
- Products `/api/Product` (+ `/api/Product/{id}`) with artisan CRUD.
- Images `/api/ProductImages` (upload/delete).
- Categories `/api/Category`, Collections `/api/ProductCollection`, Blogs `/api/Blog`.
- Cart `/api/Cart`, `/api/CartItem`; Wishlist `/api/WishList`.
- Feedback `/api/Feedback`; Vouchers `/api/Voucher`.

## 4. Order & Shipment Flow
1. Client calls `POST /api/Order/orders`:
   ```jsonc
   {
     "shipingAddressId": "ADDR-123",
     "receiverName": "Nguyen Van A",
     "receiverPhone": "0912345678",
     "toDistrictId": 1454,
     "toWardCode": "21039",
     "toAddress": "45 Ly Thuong Kiet, P.7, Q.10",
     "toProvinceName": "TP.HCM",
     "totalWeight": 1200,
     "shipmentItems": [
       { "productId": "PRD001", "weight": 800 },
       { "productId": "PRD002", "weight": 400 }
     ]
   }
   ```
2. Backend loads cart, validates address metadata.
3. Items grouped by seller. Seller pickup profile (token/shop + warehouse) fetched from `/api/seller/shipping-profile/me`; if missing, platform warehouse is used.
4. For each seller group, `IGhnShippingService` sends GHN create shipment. Each response creates a `Shipment`, `ShipmentHistory`, and a `ShipmentStatusUpdated` SignalR event.
5. User views orders via:
   - `POST /api/Order/my-orders` (filtered list).
   - `GET /api/Order/orders/{orderId}?pageIndex=&pageSize=` (single order with paged items + shipments + history snapshot).
6. Cancellation: `POST /api/Order/orders/{orderId}/cancel` (body `{ "reason": "optional" }`). Cancels GHN orders, logs history, broadcasts realtime.

## 5. Shipment Utilities & Seller Config
- GHN master-data proxies:
  - `GET /api/ghn/master-data/provinces`
  - `GET /api/ghn/master-data/districts?provinceId=...`
  - `GET /api/ghn/master-data/wards?districtId=...`
- Seller pickup/token profile:
  - `GET /api/seller/shipping-profile/me`
  - `PUT /api/seller/shipping-profile/me` with
    ```jsonc
    {
      "pickupContactName": "Le Van B",
      "pickupContactPhone": "0900000000",
      "pickupAddressLine": "12 Nguyen Trai, Ha Noi",
      "pickupProvinceName": "Ha Noi",
      "pickupDistrictId": 1452,
      "pickupWardCode": "21057",
      "ghnToken": "seller-token",
      "ghnShopId": 2510562,
      "isActive": true
    }
    ```
  - These settings inject seller-specific GHN credentials during order fulfillment.

## 6. GHN Webhook & Realtime Notifications
- `POST /api/ghn/webhook` (called by GHN) payload `{ OrderCode, ClientOrderCode, CurrentStatus, UpdatedDate, CodCollected, Reason, ... }`.
  - Updates `Shipment`, appends `ShipmentHistory`, syncs `Order.Status` and `Payment.PaymentStatus`.
  - Uses `IShipmentRealtimeService` to push `ShipmentStatusUpdated` over SignalR hub `/hubs/notifications` (group `notifications:{userId}`).
- SignalR clients connect via `/hubs/notifications?access_token=<jwt>` and listen for:
  - `ReceiveNotification(ResponseNotificationDto)`
  - `ShipmentStatusUpdated(ShipmentStatusUpdateDto)`

## 7. Payment & COD
- Manual admin update:`PUT /api/Payment/status` with `{ "paymentId", "status" }`.
- GHN COD updates propagate automatically from webhook; notifications sent via `INotificationService`.

## 8. Notifications & Reports
- Notifications: `/api/Notification` (list, mark read, delete) + `/api/Notification/admin-send` for broadcasts.
- Reports (user-generated): `/api/Report` endpoints for create + admin review.

## 9. Metadata Requirements
- **Addresses** store GHN codes/contact info once; order creation reuses them automatically.
- **ProductShippingProfile** (weight/dimensions) optional but recommended so the client doesn’t need to send parcel sizes.
- **SellerShippingProfile** required for true multi-seller shipping (token/shop + pickup data). Without it, shipments originate from platform warehouse/token.

## 10. Database & Migrations
Apply latest schema after pulling:
```bash
cd Backend_SEP490
set DB_PASSWORD=your_password
 dotnet ef database update
```
Includes migrations:
- `20251114152530_AddGhnShippingMetadata`
- `20251114163409_AddShipmentHistoryAndSellerProfile`

## 11. Troubleshooting
- **GHN 400 (phone/ward)** → verify receiver phone and GHN codes using master-data APIs.
- **“Seller has no pickup info”** → seller hasn’t configured `/api/seller/shipping-profile/me`.
- **No realtime updates** → ensure client joins SignalR hub with valid JWT and listens for `ShipmentStatusUpdated`.
- **Order saved but no GHN shipment** → check logs for GHN error message; order persists even if GHN rejects payload.

## 12. Deployment (Docker & Azure)

### Docker (local)
1) Sao chép `Backend_SEP490/Backend_SEP490/.env.example` thành `Backend_SEP490/Backend_SEP490/.env` và cập nhật `ConnectionStrings__DefaultConnection`, JWT, Cloudinary, OpenAI, GHN, VNPay, email...
2) Chạy `docker compose up -d --build` ngay từ thư mục gốc repo (dạng API trên `http://localhost:8080`, Postgres trên `localhost:5432`).
3) Khi deploy production qua Docker, thay cặp `.env` phù hợp và update `Cors__AllowedOrigins__*` cho domain frontend.

### Azure (App Service/Container Apps)
- Build/push image: `docker build -t <acr>.azurecr.io/backend-sep490:<tag> -f Backend_SEP490/Backend_SEP490/Dockerfile .` sau đó `docker push <acr>.azurecr.io/backend-sep490:<tag>` (hoặc dùng `az acr build`).
- Triển khai container: dạng App Service for Containers hoặc Azure Container Apps, chạy hình docker image trên cổng `8080` và khai báo cặp settings:
  - `ASPNETCORE_URLS=http://+:8080`, `WEBSITES_PORT=8080`
  - `ConnectionStrings__DefaultConnection=Host=<db-host>;Port=5432;Database=<db>;Username=<user>;Password=<pwd>`
  - Toàn bộ env cần thiết: `JWT_KEY`, `JWT_ISSUER`, `JWT_AUDIENCE`, `CLOUDINARY_*`, `EMAIL_*`, `OPENAI_API_KEY`, `GHN_*`, `VNPAY_*`, `Cors__AllowedOrigins__0=https://<frontend-domain>`
- Những app setting này phủ thay file `.env`; không nên đẩy thẳng `.env` vào image.
