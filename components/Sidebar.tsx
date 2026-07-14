// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { navLinks } from '@/lib/navLinks';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.isAdmin ? 'admin' : 'teller';

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-zinc-900 text-white">
      <div className="h-16 flex items-center px-6 border-b border-zinc-800">
        <span className="text-lg font-bold tracking-wide">BAGGO BAGS</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navLinks
          .filter((link) => link.roles.includes(role))
          .map((link, idx) => {
            if (link.heading) {
              return (
                <p key={`heading-${idx}`} className="px-3 pt-4 pb-1 text-xs uppercase tracking-wider text-zinc-500">
                  {link.heading}
                </p>
              );
            }
            const Icon = link.icon!;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href!}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-amber-500 text-zinc-900' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
