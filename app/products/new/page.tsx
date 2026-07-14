// app/products/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

interface VariantInput {
  name: string;
  price: string;
  stock: string;
}

interface CategoryOption {
  _id: string;
  name: string;
}

interface BatchOption {
  _id: string;
  code: string;
  label?: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [batch, setBatch] = useState('');
  const [variants, setVariants] = useState<VariantInput[]>([{ name: '', price: '', stock: '' }]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/categories').then((res) => res.json()).then((data) => setCategories(data.categories || []));
    fetch('/api/stock-batches').then((res) => res.json()).then((data) => setBatches(data.batches || []));
  }, []);

  const updateVariant = (idx: number, field: keyof VariantInput, value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };

  const addVariant = () => setVariants((prev) => [...prev, { name: '', price: '', stock: '' }]);
  const removeVariant = (idx: number) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError(null);
    if (!name || !code || !category || !batch) return setError('All fields except image are required.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          code,
          category,
          batch,
          variants: variants.map((v) => ({ name: v.name, price: Number(v.price), stock: Number(v.stock) })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create product.');
      router.push('/products');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 mb-6">Add Product</h1>

      <div className="bg-white rounded-xl border p-5 space-y-4">
        <input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
        <input placeholder="Product code (unique)" value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />

        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">Select category...</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm">
          <option value="">Select stock batch (BGA#)...</option>
          {batches.map((b) => (
            <option key={b._id} value={b._id}>{b.code} {b.label ? `— ${b.label}` : ''}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 -mt-2">
          No batch yet? Create one first under Admin → Stock Batches.
        </p>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-zinc-700">Variants</p>
          {variants.map((v, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input placeholder="Name (e.g. Blue)" value={v.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} className="flex-1 px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Price" type="number" value={v.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} className="w-24 px-3 py-2 border rounded-lg text-sm" />
              <input placeholder="Stock" type="number" value={v.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} className="w-24 px-3 py-2 border rounded-lg text-sm" />
              {variants.length > 1 && (
                <button onClick={() => removeVariant(idx)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              )}
            </div>
          ))}
          <button onClick={addVariant} className="flex items-center gap-1 text-xs text-amber-600 font-semibold">
            <Plus className="h-3 w-3" /> Add another variant
          </button>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 bg-zinc-800 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
          {submitting ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </div>
  );
}
