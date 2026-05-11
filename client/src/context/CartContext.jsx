import { useEffect, useMemo, useRef, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, serverTimestamp } from "../firebase";
import CartContext from "./cartContext";
import { useAuth } from "./useAuth";

function getStorageKey(uid) {
  return `spice-root-cart:${uid}`;
}

function createItemKey(productId, size) {
  return `${productId}::${size || "default"}`;
}

function getCartDocRef(uid) {
  return doc(db, "users", uid, "cart", "current");
}

function normalizeCartItem(item) {
  return {
    key: item.key,
    id: item.id,
    name: item.name,
    image: item.image,
    price: Number(item.price) || 0,
    unit: item.unit || "1 KG",
    size: item.size || "",
    quantity: Math.max(1, Number(item.quantity) || 1),
  };
}

function readStoredCart(uid) {
  if (typeof window === "undefined" || !uid) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(uid));

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeCartItem) : [];
  } catch {
    return [];
  }
}

function mergeCartItems(primaryItems = [], secondaryItems = []) {
  const merged = new Map();

  [...primaryItems, ...secondaryItems].forEach((item) => {
    const normalized = normalizeCartItem(item);
    const existing = merged.get(normalized.key);

    if (existing) {
      merged.set(normalized.key, {
        ...existing,
        quantity: Math.max(existing.quantity, normalized.quantity),
      });
      return;
    }

    merged.set(normalized.key, normalized);
  });

  return Array.from(merged.values());
}

function serializeCartItems(cartItems) {
  return JSON.stringify((cartItems || []).map(normalizeCartItem));
}

export function CartProvider({ children }) {
  const { currentUser, isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [hasLoadedRemoteCart, setHasLoadedRemoteCart] = useState(false);
  const hadLocalChangesBeforeHydration = useRef(false);
  const lastRemoteCartSignature = useRef("");

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.uid) {
      setItems([]);
      setHasLoadedRemoteCart(false);
      hadLocalChangesBeforeHydration.current = false;
      return;
    }

    const cachedItems = readStoredCart(currentUser.uid);
    setItems(cachedItems);

    const unsubscribe = onSnapshot(
      getCartDocRef(currentUser.uid),
      (snapshot) => {
        const remoteItems = snapshot.exists()
          ? Array.isArray(snapshot.data()?.items)
            ? snapshot.data().items.map(normalizeCartItem)
            : []
          : [];
        const remoteSignature = serializeCartItems(remoteItems);
        lastRemoteCartSignature.current = remoteSignature;

        setItems((current) =>
          {
            const nextItems = hadLocalChangesBeforeHydration.current
              ? mergeCartItems(remoteItems, current)
              : remoteItems;

            return serializeCartItems(current) === serializeCartItems(nextItems) ? current : nextItems;
          }
        );
        setHasLoadedRemoteCart(true);
        hadLocalChangesBeforeHydration.current = false;
      },
      (error) => {
        console.error("Failed to load cart from Firestore:", error);
        setHasLoadedRemoteCart(true);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, isAuthenticated]);

  useEffect(() => {
    if (typeof window === "undefined" || !isAuthenticated || !currentUser?.uid) {
      return;
    }

    window.localStorage.setItem(getStorageKey(currentUser.uid), JSON.stringify(items));
  }, [currentUser?.uid, isAuthenticated, items]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.uid || !hasLoadedRemoteCart) {
      return;
    }

    const itemSignature = serializeCartItems(items);

    if (itemSignature === lastRemoteCartSignature.current) {
      return;
    }

    setDoc(
      getCartDocRef(currentUser.uid),
      {
        items,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    ).catch((error) => {
      console.error("Failed to save cart to Firestore:", error);
    });
  }, [currentUser?.uid, hasLoadedRemoteCart, isAuthenticated, items]);

  const markPendingHydrationChange = () => {
    if (!hasLoadedRemoteCart) {
      hadLocalChangesBeforeHydration.current = true;
    }
  };

  const addItem = (product, quantity = 1, size = "") => {
    if (!isAuthenticated || !product?.id) {
      return false;
    }

    const key = createItemKey(product.id, size);
    markPendingHydrationChange();

    setItems((current) => {
      const existingItem = current.find((item) => item.key === key);

      if (existingItem) {
        return current.map((item) =>
          item.key === key
            ? { ...item, quantity: item.quantity + Math.max(1, quantity) }
            : item
        );
      }

      return [
        ...current,
        normalizeCartItem({
          key,
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          unit: product.unit,
          size,
          quantity,
        }),
      ];
    });

    return true;
  };

  const updateQuantity = (itemKey, quantity) => {
    const nextQuantity = Math.max(1, Number(quantity) || 1);
    markPendingHydrationChange();

    setItems((current) =>
      current.map((item) =>
        item.key === itemKey ? { ...item, quantity: nextQuantity } : item
      )
    );
  };

  const increaseQuantity = (itemKey) => {
    markPendingHydrationChange();
    setItems((current) =>
      current.map((item) =>
        item.key === itemKey ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (itemKey) => {
    markPendingHydrationChange();
    setItems((current) =>
      current
        .map((item) =>
          item.key === itemKey ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (itemKey) => {
    markPendingHydrationChange();
    setItems((current) => current.filter((item) => item.key !== itemKey));
  };

  const clearCart = () => {
    markPendingHydrationChange();
    setItems([]);
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      clearCart,
    }),
    [itemCount, items, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
