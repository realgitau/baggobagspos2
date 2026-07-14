// lib/navLinks.ts
import {
  LayoutDashboard,
  Package,
  Users,
  BarChart2,
  Store,
  Tag,
  FileText,
  DollarSign,
  ListOrdered,
  Bell,
  User2,
  Boxes,
  type LucideIcon,
} from 'lucide-react';

export interface NavLink {
  href?: string;
  label?: string;
  icon?: LucideIcon;
  heading?: string;
  roles: ('admin' | 'teller')[];
}

export const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teller'] },
  { href: '/shop', label: 'Shop', icon: Store, roles: ['admin', 'teller'] },
  { href: '/orders', label: 'Orders', icon: ListOrdered, roles: ['admin', 'teller'] },
  { href: '/products', label: 'Products', icon: Package, roles: ['admin', 'teller'] },
  { href: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'teller'] },
  { href: '/profile', label: 'Profile', icon: User2, roles: ['admin', 'teller'] },
  { heading: 'Admin', roles: ['admin'] },
  { href: '/admin/users', label: 'User Management', icon: Users, roles: ['admin'] },
  { href: '/admin/categories', label: 'Categories', icon: Tag, roles: ['admin'] },
  { href: '/admin/stock-batches', label: 'Stock Batches', icon: Boxes, roles: ['admin'] },
  { href: '/reports', label: 'Reports', icon: BarChart2, roles: ['admin'] },
  { href: '/admin/commissions', label: 'Commissions', icon: DollarSign, roles: ['admin'] },
];
