# Backend_SEP490

## GHN Test API Integration

The order workflow now talks to GHN's **test** gateway (`https://dev-online-gateway.ghn.vn`).  
Set the following variables in your `.env` before running the API:

| Key | Description |
| --- | --- |
| `GHN_TEST_TOKEN` | API token issued for the GHN sandbox |
| `GHN_TEST_SHOP_ID` | ShopId mapped to your test store |
| `GHN_TEST_BASE_URL` *(optional)* | Defaults to `https://dev-online-gateway.ghn.vn` |
| `GHN_TEST_FROM_NAME` / `GHN_TEST_FROM_PHONE` / `GHN_TEST_FROM_ADDRESS` | Pickup contact info |
| `GHN_TEST_FROM_DISTRICT_ID` / `GHN_TEST_FROM_WARD_CODE` | Numeric/QH code for the pickup location |
| `GHN_TEST_TO_DISTRICT_ID` / `GHN_TEST_TO_WARD_CODE` | Default receiver codes when the user's address has no mapping |
| `GHN_TEST_FALLBACK_PHONE` *(optional)* | Used when the customer phone number is empty |
| `GHN_TEST_PAYMENT_TYPE_ID` *(optional)* | Defaults to `2` (receiver pays shipping) |
| `GHN_TEST_SERVICE_TYPE_ID` *(optional)* | Defaults to `2` (standard service) |
| `GHN_TEST_REQUIRED_NOTE` *(optional)* | Shipping note passed to GHN |
| `GHN_TEST_DEFAULT_ITEM_WEIGHT`, `GHN_TEST_DEFAULT_PARCEL_LENGTH`, `GHN_TEST_DEFAULT_PARCEL_WIDTH`, `GHN_TEST_DEFAULT_PARCEL_HEIGHT` | Default dimensions/weight (in grams/cm) used when products don't specify them |

Only GHN's sandbox is called; no production endpoints are touched.  
When an order is created:

1. The shipping address is validated and GHN receives the order lines (name/code/quantity/price) plus user phone/address.
2. GHN's response (order code, status, ETA) is stored as a `Shipment` record with provider `GHN-TEST`.
3. Failures are logged but do not stop the order transaction.

Configure the codes/phones above with GHN's test data to avoid rejected requests.

### Creating orders with real test data

`POST /api/Order/orders` now expects the payload to include the real shipment metadata so the GHN test gateway can echo your actual products/user info:

```jsonc
{
  "shipingAddressId": "addr-123",
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

Those values are passed unchanged to GHN (only falling back to `GHN_TEST_*` defaults if a field is missing), letting you verify the full payload/response loop without shipping real parcels.

- **Luu y Address/Product**: moi dia chi nguoi dung can khai bao `ContactName`, `ContactPhone`, `GhnProvinceId`, `GhnDistrictId`, `GhnWardCode`. Moi san pham co the gan `ProductShippingProfile` (can nang, kich thuoc) de backend tu tinh toan khi gui GHN.
- **Tra cuu ma khu vuc**: dung `GET /api/ghn/master-data/provinces`, `GET /api/ghn/master-data/districts?provinceId=...`, `GET /api/ghn/master-data/wards?districtId=...` de hien danh sach cho nguoi dung lua chon thay vi nhap tay.
- **Cau hinh pick-up theo seller**: seller goi `GET/PUT /api/seller/shipping-profile/me` de dang ky token/shopId GHN va dia chi lay hang rieng. Neu bo trong, he thong tu fallback ve kho mac dinh cua san.

### Shipment lifecycle

- `POST /api/Order/orders/{orderId}/cancel` cho phép ngu?i mua h?y v?n don dang ch?; backend g?i GHN cancel và d?i tr?ng thái `Shipment` + `Order` sang `Cancelled`.
- GHN g?i status/COD qua `POST /api/ghn/webhook`: controller c?p nh?t `Shipment.ShippingStatus`, d?ng b? `Order.Status`, và d?i `Payment` sang `Paid` khi `CodCollected = true`.
- M?i l?n tr?ng thái thay d?i, m?t b?n ghi `ShipmentHistory` m?i du?c t?o và phát real-time t?i ngu?i dùng qua SignalR (`ShipmentStatusUpdated`), vì v?y UI không c?n refresh th? công.
- `ResponseDTOOrder` tr? thêm `Shipments[]` (tracking, status, timestamp) d? frontend hi?n th? chi ti?t t?ng v?n don.
- V?i don nhi?u seller, backend t? nhóm theo ngu?i bán và t?o 1 shipment GHN cho t?ng seller d?a trên c?u hình pickup/token mà seller dang ký.

