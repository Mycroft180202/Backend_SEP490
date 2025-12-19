import { useContext, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { UserContext } from '../../context/UserContext';
import { NotificationHub } from '../modules/notification/notificationHub';

const emitWindowEvent = (name, detail) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

const safeString = (value) => (typeof value === 'string' ? value : '');

const formatAdjustmentToast = (adjustment) => {
  if (!adjustment) return null;
  const productName = safeString(adjustment.productName) || 'Sản phẩm';
  const requested = Number(adjustment.requestedQuantity);
  const applied = Number(adjustment.appliedQuantity);
  const available = Number(adjustment.availableStock);

  if (!Number.isFinite(requested) || !Number.isFinite(applied) || requested === applied) {
    return null;
  }

  if (Number.isFinite(available)) {
    return `${productName} được điều chỉnh số lượng từ ${requested} xuống ${applied} (tồn kho: ${available}).`;
  }
  return `${productName} được điều chỉnh số lượng từ ${requested} xuống ${applied}.`;
};

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

        const onCartUpdated = (cart) => {
          emitWindowEvent('realtime:cartUpdated', cart);
          emitWindowEvent('cart:updated');
        };

        const onCartItemAdjusted = (adjustment) => {
          emitWindowEvent('realtime:cartItemAdjusted', adjustment);
          emitWindowEvent('cart:updated');

          const toastMessage = formatAdjustmentToast(adjustment);
          if (!toastMessage) return;

          const toastKey = `${adjustment?.cartItemId || ''}:${adjustment?.requestedQuantity}:${adjustment?.appliedQuantity}:${adjustment?.availableStock}`;
          if (toastKey && toastKey === lastToastKeyRef.current) return;
          lastToastKeyRef.current = toastKey;

          toast.info(toastMessage, { autoClose: 5000 });
        };

        const onOrderUpdated = (orderUpdate) => {
          emitWindowEvent('realtime:orderUpdated', orderUpdate);
        };

        const onPaymentUpdated = (paymentUpdate) => {
          emitWindowEvent('realtime:paymentUpdated', paymentUpdate);
        };

        const onProductStockUpdated = (stockUpdate) => {
          emitWindowEvent('realtime:productStockUpdated', stockUpdate);
        };

        const onShipmentStatusUpdated = (shipmentUpdate) => {
          emitWindowEvent('realtime:shipmentStatusUpdated', shipmentUpdate);
        };

        connection.on('CartUpdated', onCartUpdated);
        connection.on('CartItemAdjusted', onCartItemAdjusted);
        connection.on('OrderUpdated', onOrderUpdated);
        connection.on('PaymentUpdated', onPaymentUpdated);
        connection.on('ProductStockUpdated', onProductStockUpdated);
        connection.on('ShipmentStatusUpdated', onShipmentStatusUpdated);

        cleanup = () => {
          connection.off('CartUpdated', onCartUpdated);
          connection.off('CartItemAdjusted', onCartItemAdjusted);
          connection.off('OrderUpdated', onOrderUpdated);
          connection.off('PaymentUpdated', onPaymentUpdated);
          connection.off('ProductStockUpdated', onProductStockUpdated);
          connection.off('ShipmentStatusUpdated', onShipmentStatusUpdated);
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

