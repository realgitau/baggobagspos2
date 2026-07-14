// app/products/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';

interface ProductRow {
  _id: string;
  name: string;
  code: string;
  category: { name: string };
  batch: { code: string };
  variants: { name: string; price: number; stock: number }[];
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-800">Products</h1>
        {session?.user?.isAdmin && (
          <Link href="/products/new" className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-xl text-sm font-semibold">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Variants / Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-t">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.code}</td>
                  <td className="px-4 py-3">{p.category?.name}</td>
                  <td className="px-4 py-3">{p.batch?.code}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.variants.map((v) => `${v.name} (${v.stock})`).join(', ')}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
