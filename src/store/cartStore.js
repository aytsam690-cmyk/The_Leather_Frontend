import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Clear stale coupon shape from localStorage (old shape had discountAmount, new shape has type+value)
try {
  const raw = localStorage.getItem('cart-storage');
  if (raw) {
    const parsed = JSON.parse(raw);
    const coupon = parsed?.state?.appliedCoupon;
    if (coupon && ('discountAmount' in coupon) && !('type' in coupon)) {
      parsed.state.appliedCoupon = null;
      localStorage.setItem('cart-storage', JSON.stringify(parsed));
    }
  }
} catch (_) {}

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (product, qty = 1, variant = null) => {
        const items = get().items;
        const key = `${product._id}-${variant?.size || ''}-${variant?.color || ''}`;
        const effectivePrice = (variant?.price && Number(variant.price) > 0) ? Number(variant.price) : product.price;
        const existing = items.find((i) => i.key === key);
        if (existing) {
          set({
            items: items.map((i) =>
              i.key === key ? { ...i, qty: i.qty + qty } : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, price: effectivePrice, qty, variant, key }] });
        }
      },

      removeItem: (key) =>
        set({ items: get().items.filter((i) => i.key !== key) }),

      updateQty: (key, qty) => {
        if (qty <= 0) {
          get().removeItem(key);
          return;
        }
        set({
          items: get().items.map((i) => (i.key === key ? { ...i, qty } : i)),
        });
      },

      appliedCoupon: null, // { code, type, value, maxDiscount }

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),

      clearCart: () => set({ items: [], appliedCoupon: null }),

      get total() {
        return get().items.reduce((sum, i) => sum + i.price * i.qty, 0);
      },

      get itemCount() {
        return get().items.reduce((sum, i) => sum + i.qty, 0);
      },
    }),
    { name: 'cart-storage' }
  )
);

export default useCartStore;
