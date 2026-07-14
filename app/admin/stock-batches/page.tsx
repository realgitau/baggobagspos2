// app/admin/stock-batches/page.tsx
'use client';

import { useEffect, useState } from 'react';

interface Batch {
  _id: string;
  slotNumber: number;
  code: string;
  label?: string;
  active: boolean;
}

export default function StockBatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [slotNumber, setSlotNumber] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBatches = () => {
    fetch('/api/stock-batches')
      .then((res) => res.json())
      .then((data) => setBatches(data.batches || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreate = async () => {
    setError(null);
    try {
      const res = await fetch('/api/stock-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotNumber: Number(slotNumber), label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create batch.');
      setSlotNumber('');
      setLabel('');
      fetchBatches();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl">
      <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 mb-1">Stock Batches</h1>
      <p className="text-sm text-gray-500 mb-6">
        Create a batch slot (BGA1...BGA999), then assign it to a product when uploading stock.
      </p>

      <div className="bg-white rounded-xl border p-5 mb-6 space-y-3">
        <div className="flex gap-3">
          <input
            type="number"
            min={1}
            max={999}
            placeholder="Slot number (1-999)"
            value={slotNumber}
            onChange={(e) => setSlotNumber(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
          <input
            placeholder="Label (optional, e.g. 'July restock')"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button onClick={handleCreate} className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-semibold">
          Create Batch Slot
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {batches.map((b) => (
            <div key={b._id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-zinc-800">{b.code}</p>
                {b.label && <p className="text-xs text-gray-400">{b.label}</p>}
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${b.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {b.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
          {batches.length === 0 && <p className="p-4 text-sm text-gray-400">No batches yet.</p>}
        </div>
      )}
    </div>
  );
}
