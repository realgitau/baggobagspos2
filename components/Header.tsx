// components/Header.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Bell, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6">
      <div className="md:hidden font-bold text-zinc-800 tracking-wide">BAGGO BAGS</div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-4">
        <Link href="/notifications" className="p-2 rounded-full hover:bg-gray-100 text-zinc-600">
          <Bell className="h-5 w-5" />
        </Link>
        <div className="text-sm text-right hidden sm:block">
          <p className="font-semibold text-zinc-800">{session.user?.name}</p>
          <p className="text-xs text-gray-500">{session.user?.isAdmin ? 'Admin' : 'Teller'}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="p-2 rounded-full hover:bg-gray-100 text-zinc-600"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
