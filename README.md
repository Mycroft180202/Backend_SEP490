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
  "totalWeight": 1200,
  "parcelLength": 30,
  "parcelWidth": 20,
  "parcelHeight": 15,
  "shipmentItems": [
    { "productId": "PRD001", "weight": 800 },
    { "productId": "PRD002", "weight": 400 }
  ]
}
```

Those values are passed unchanged to GHN (only falling back to `GHN_TEST_*` defaults if a field is missing), letting you verify the full payload/response loop without shipping real parcels.

### Shipment lifecycle

- `POST /api/Order/orders/{orderId}/cancel` lets a customer cancel a pending shipment. The service updates GHN via the sandbox cancel API and marks the local `Shipment` + `Order` as `cancelled`.
- GHN can push status/ COD updates to `POST /api/ghn/webhook`. The controller will:
  1. Update the matching `Shipment` status (`ready_to_pick`, `delivered`, `cancelled`, …) and timestamps.
  2. Sync the parent `Order.Status` (`Shipping`, `Completed`, `Cancelled`).
  3. Mark related `Payment` rows as `Paid` when GHN reports `CodCollected = true` and notify the customer through the existing notification service.
- `ResponseDTOOrder` now includes `Shipments[]` so frontend testers can see tracking numbers + statuses immediately after placing an order.
- If an order contains items from multiple sellers, the backend automatically groups them per seller and creates one GHN shipment per seller (using that seller’s pickup info). Each shipment receives its own tracking code, and cancellations/webhooks operate on every shipment individually.
