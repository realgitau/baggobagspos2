// components/PrintButton.tsx
'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 bg-zinc-800 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition"
    >
      Print Receipt
    </button>
  );
}
