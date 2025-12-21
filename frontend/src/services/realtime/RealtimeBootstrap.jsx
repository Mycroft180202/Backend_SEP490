import { useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { UserContext } from '../../context/UserContext';
import { NotificationHub } from '../modules/notification/notificationHub';

const isDebugEnabled = () => NotificationHub?.isDebugEnabled?.() === true;

const emitWindowEvent = (name, detail) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const pick = (obj, ...keys) => {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    if (key in obj) return obj[key];
  }
  return undefined;
};

const safeString = (value) => (typeof value === 'string' ? value : '');

const formatAdjustmentToast = (adjustment) => {
  if (!adjustment) return null;
  const productName = safeString(pick(adjustment, 'productName', 'ProductName')) || 'Sản phẩm';
  const requested = Number(pick(adjustment, 'requestedQuantity', 'RequestedQuantity'));
  const applied = Number(pick(adjustment, 'appliedQuantity', 'AppliedQuantity'));
  const available = Number(pick(adjustment, 'availableStock', 'AvailableStock'));

  if (!Number.isFinite(requested) || !Number.isFinite(applied) || requested === applied) {
    return null;
  }

  if (Number.isFinite(available)) {
    return `${productName} được điều chỉnh số lượng từ ${requested} xuống ${applied} (tồn kho: ${available}).`;
  }
  return `${productName} được điều chỉnh số lượng từ ${requested} xuống ${applied}.`;
};

const normalizeStockUpdate = (update) => ({
  productId: pick(update, 'productId', 'ProductId'),
  productName: pick(update, 'productName', 'ProductName'),
  stock: pick(update, 'stock', 'Stock'),
  isActive: pick(update, 'isActive', 'IsActive'),
  isOutOfStock: pick(update, 'isOutOfStock', 'IsOutOfStock'),
  updatedAt: pick(update, 'updatedAt', 'UpdatedAt'),
});

const normalizeCartItemAdjustment = (adjustment) => ({
  userId: pick(adjustment, 'userId', 'UserId'),
  cartId: pick(adjustment, 'cartId', 'CartId'),
  cartItemId: pick(adjustment, 'cartItemId', 'CartItemId'),
  productId: pick(adjustment, 'productId', 'ProductId'),
  productName: pick(adjustment, 'productName', 'ProductName'),
  requestedQuantity: pick(adjustment, 'requestedQuantity', 'RequestedQuantity'),
  appliedQuantity: pick(adjustment, 'appliedQuantity', 'AppliedQuantity'),
  availableStock: pick(adjustment, 'availableStock', 'AvailableStock'),
  reason: pick(adjustment, 'reason', 'Reason'),
  generatedAt: pick(adjustment, 'generatedAt', 'GeneratedAt'),
});

export default function RealtimeBootstrap() {
  const { userInfo } = useContext(UserContext);
  const lastToastKeyRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;
    let cleanup = () => {};

    const setup = async () => {
      if (!userInfo) {
        await NotificationHub.stop();
        return;
      }

      try {
        const connection = await NotificationHub.ensureConnected();
        if (isCancelled) return;

        if (isDebugEnabled()) {
          console.log('[Realtime] handlers attached');
        }

        const onCartUpdated = (cart) => {
          if (isDebugEnabled()) console.log('[Realtime] CartUpdated', cart);
          emitWindowEvent('realtime:cartUpdated', cart);
          emitWindowEvent('cart:updated');
        };

        const onCartItemAdjusted = (adjustment) => {
          const normalizedAdjustment = normalizeCartItemAdjustment(adjustment);
          if (isDebugEnabled()) console.log('[Realtime] CartItemAdjusted', normalizedAdjustment);
          emitWindowEvent('realtime:cartItemAdjusted', normalizedAdjustment);
          emitWindowEvent('cart:updated');

          const toastMessage = formatAdjustmentToast(normalizedAdjustment);
          if (!toastMessage) return;

          const toastKey = `${normalizedAdjustment?.cartItemId || ''}:${normalizedAdjustment?.requestedQuantity}:${normalizedAdjustment?.appliedQuantity}:${normalizedAdjustment?.availableStock}`;
          if (toastKey && toastKey === lastToastKeyRef.current) return;
          lastToastKeyRef.current = toastKey;

          toast.info(toastMessage, { autoClose: 5000 });
        };

        const onOrderUpdated = (orderUpdate) => {
          if (isDebugEnabled()) console.log('[Realtime] OrderUpdated', orderUpdate);
          emitWindowEvent('realtime:orderUpdated', orderUpdate);
        };

        const onPaymentUpdated = (paymentUpdate) => {
          if (isDebugEnabled()) console.log('[Realtime] PaymentUpdated', paymentUpdate);
          emitWindowEvent('realtime:paymentUpdated', paymentUpdate);
        };

        const onProductStockUpdated = (stockUpdate) => {
          const normalized = normalizeStockUpdate(stockUpdate);
          if (isDebugEnabled()) console.log('[Realtime] ProductStockUpdated', normalized);
          emitWindowEvent('realtime:productStockUpdated', normalized);
        };

        const onShipmentStatusUpdated = (shipmentUpdate) => {
          if (isDebugEnabled()) console.log('[Realtime] ShipmentStatusUpdated', shipmentUpdate);
          emitWindowEvent('realtime:shipmentStatusUpdated', shipmentUpdate);
        };

        const onNotificationReceived = (notification) => {
          if (isDebugEnabled()) console.log('[Realtime] ReceiveNotification', notification);
          emitWindowEvent('realtime:notificationReceived', notification);
        };

        connection.on('CartUpdated', onCartUpdated);
        connection.on('CartItemAdjusted', onCartItemAdjusted);
        connection.on('OrderUpdated', onOrderUpdated);
        connection.on('PaymentUpdated', onPaymentUpdated);
        connection.on('ProductStockUpdated', onProductStockUpdated);
        connection.on('ShipmentStatusUpdated', onShipmentStatusUpdated);
        connection.on('ReceiveNotification', onNotificationReceived);

        cleanup = () => {
          connection.off('CartUpdated', onCartUpdated);
          connection.off('CartItemAdjusted', onCartItemAdjusted);
          connection.off('OrderUpdated', onOrderUpdated);
          connection.off('PaymentUpdated', onPaymentUpdated);
          connection.off('ProductStockUpdated', onProductStockUpdated);
          connection.off('ShipmentStatusUpdated', onShipmentStatusUpdated);
          connection.off('ReceiveNotification', onNotificationReceived);
        };
      } catch (error) {
        console.error('Realtime bootstrap error:', error);
      }
    };

    setup();

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [userInfo]);

  return null;
}
