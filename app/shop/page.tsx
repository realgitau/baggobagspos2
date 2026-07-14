// app/shop/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';

interface Variant {
  name: string;
  price: number;
  stock: number;
}

interface ProductRow {
  _id: string;
  name: string;
  code: string;
  category: { name: string };
  batch: { code: string; label?: string };
  variants: Variant[];
  image?: string;
}

export default function ShopPage() {
  const router = useRouter();
  const cart = useCart();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

  // Checkout form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'Collection' | 'Parcel'>('Collection');
  const [parcelDestination, setParcelDestination] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Mpesa' | 'Cash'>('Cash');
  const [mpesaCode, setMpesaCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => setError('Failed to load products.'))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (product: ProductRow, variant: Variant) => {
    cart.addLine({
      productId: product._id,
      productName: product.name,
      variantName: variant.name,
      price: variant.price,
      maxStock: variant.stock,
    });
    setCartOpen(true);
  };

  const handleCheckout = async () => {
    setError(null);

    if (cart.lines.length === 0) return setError('Cart is empty.');
    if (!customerName || !customerPhone) return setError('Customer name and phone are required.');
    if (deliveryType === 'Parcel' && !parcelDestination) return setError('Parcel destination is required.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.lines.map((l) => ({ productId: l.productId, variantName: l.variantName, quantity: l.quantity })),
          customerName,
          customerPhone,
          discount,
          paymentMethod,
          mpesaDetails: paymentMethod === 'Mpesa' ? { phone: customerPhone, transactionCode: mpesaCode } : undefined,
          deliveryType,
          parcelDestination: deliveryType === 'Parcel' ? parcelDestination : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order.');

      cart.clearCart();
      router.push(`/shop/receipt/${data.order._id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-800">Shop</h1>
        <button
          onClick={() => setCartOpen(true)}
          className="relative flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-xl text-sm font-semibold"
        >
          <ShoppingCart className="h-4 w-4" />
          Cart
          {cart.itemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-amber-500 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {cart.itemCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading products...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl border p-4 shadow-sm">
              <p className="font-semibold text-zinc-800 text-sm mb-1">{product.name}</p>
              <p className="text-xs text-gray-400 mb-2">
                {product.code} · Batch {product.batch?.code}
              </p>
              <div className="space-y-2">
                {product.variants.map((variant) => (
                  <div key={variant.name} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-zinc-700">{variant.name}</p>
                      <p className="text-gray-400">KES {variant.price.toLocaleString()} · {variant.stock} in stock</p>
                    </div>
                    <button
                      disabled={variant.stock === 0}
                      onClick={() => handleAddToCart(product, variant)}
                      className="px-2 py-1 bg-amber-500 text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-zinc-800">Cart</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 text-sm">Close</button>
            </div>

            {cart.lines.length === 0 ? (
              <p className="text-sm text-gray-500">Cart is empty.</p>
            ) : (
              <div className="space-y-3 mb-6">
                {cart.lines.map((line) => (
                  <div key={`${line.productId}-${line.variantName}`} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{line.productName}</p>
                      <p className="text-xs text-gray-400">{line.variantName} · KES {line.price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => cart.updateQuantity(line.productId, line.variantName, line.quantity - 1)}>
                        <Minus className="h-4 w-4 text-gray-500" />
                      </button>
                      <span className="text-sm w-4 text-center">{line.quantity}</span>
                      <button onClick={() => cart.updateQuantity(line.productId, line.variantName, line.quantity + 1)}>
                        <Plus className="h-4 w-4 text-gray-500" />
                      </button>
                      <button onClick={() => cart.removeLine(line.productId, line.variantName)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <input
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                placeholder="Customer phone (07xx...)"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />

              <div className="flex gap-2">
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as 'Collection' | 'Parcel')}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="Collection">In-store Collection</option>
                  <option value="Parcel">Parcel</option>
                </select>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'Mpesa' | 'Cash')}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="Cash">Cash</option>
                  <option value="Mpesa">Mpesa</option>
                </select>
              </div>

              {deliveryType === 'Parcel' && (
                <input
                  placeholder="Destination (e.g. Nakuru)"
                  value={parcelDestination}
                  onChange={(e) => setParcelDestination(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              )}

              {paymentMethod === 'Mpesa' && (
                <input
                  placeholder="Mpesa transaction code"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              )}

              <input
                type="number"
                placeholder="Discount (KES)"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />

              <div className="flex justify-between text-sm font-semibold text-zinc-800 pt-2">
                <span>Total</span>
                <span>KES {(cart.subtotal - discount).toLocaleString()}</span>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Placing order...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
