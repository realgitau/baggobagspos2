// components/BottomNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LayoutDashboard, Store, ListOrdered, Bell, User2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_LINKS = [
  { href: '/', label: 'Home', icon: LayoutDashboard },
  { href: '/shop', label: 'Shop', icon: Store },
  { href: '/orders', label: 'Orders', icon: ListOrdered },
  { href: '/notifications', label: 'Alerts', icon: Bell },
  { href: '/profile', label: 'Profile', icon: User2 },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();

  if (status !== 'authenticated') return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t md:hidden">
      <div className="grid grid-cols-5">
        {MOBILE_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium',
                isActive ? 'text-amber-600' : 'text-zinc-500'
              )}
            >
              <Icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
