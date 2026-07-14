// app/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  BarChart2,
  Clock,
  UserCheck,
  TrendingUp,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RecentActivity {
  orderId: string;
  type: string;
  title: string;
  description: string;
  time: string;
}

interface AdminStats {
  todaySales: number;
  todayOrders: number;
  pendingOrders: number;
  activeTellers: number;
  recentActivity: RecentActivity[];
}

interface TellerStats {
  today: {
    sales: number;
    orderCount: number;
    commission: number;
    itemsSold: number;
  };
}

const getActivityIcon = (type: string): LucideIcon => {
  switch (type) {
    case 'NEW_ORDER':
      return ShoppingCart;
    default:
      return Package;
  }
};

export default function Home() {
  const { data: session, status } = useSession();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [tellerStats, setTellerStats] = useState<TellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.isAdmin;

  useEffect(() => {
    if (!session) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        if (isAdmin) {
          const res = await fetch('/api/stats');
          const data = await res.json();
          setAdminStats(data);
        } else {
          const res = await fetch(`/api/tellers/dashboard-stats?tellerId=${session.user.id}`);
          if (!res.ok) throw new Error('Failed to fetch teller stats');
          const data = await res.json();
          setTellerStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, isAdmin]);

  const adminQuickActions = [
    { icon: ShoppingCart, label: 'New Sale', href: '/shop' },
    { icon: Package, label: 'Products', href: '/products' },
    { icon: Users, label: 'Manage Users', href: '/admin/users' },
    { icon: BarChart2, label: 'View Reports', href: '/reports' },
  ];

  const tellerQuickActions = [
    { icon: ShoppingCart, label: 'New Sale', href: '/shop', primary: false },
    { icon: FileText, label: 'Orders', href: '/orders', primary: true },
  ];

  const adminStatCards = [
    { icon: DollarSign, title: "Today's Revenue", value: adminStats?.todaySales, prefix: 'KES ' },
    { icon: ShoppingCart, title: "Today's Orders", value: adminStats?.todayOrders },
    { icon: Clock, title: 'Pending Orders', value: adminStats?.pendingOrders },
    { icon: UserCheck, title: 'Active Tellers', value: adminStats?.activeTellers },
  ];

  const tellerStatCards = [
    { icon: DollarSign, title: "My Today's Sales", value: tellerStats?.today?.sales, prefix: 'KES ' },
    { icon: ShoppingCart, title: "My Today's Orders", value: tellerStats?.today?.orderCount },
    { icon: TrendingUp, title: 'My Commission Today', value: tellerStats?.today?.commission, prefix: 'KES ' },
    { icon: Package, title: 'Items Sold Today', value: tellerStats?.today?.itemsSold },
  ];

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-zinc-800"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-4">
        <p className="text-zinc-700 font-medium text-sm">Please sign in to continue.</p>
        <Link href="/login" className="px-5 py-2 bg-zinc-800 text-white rounded-xl text-sm font-semibold hover:bg-zinc-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const statCards = isAdmin ? adminStatCards : tellerStatCards;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-800">Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {session?.user?.name || 'User'}!</p>
        </div>
        {isAdmin && (
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">Admin View</span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((card) => (
          <StatCard key={card.title} icon={card.icon} title={card.title} value={card.value} prefix={card.prefix} loading={loading} />
        ))}
      </div>

      <div className={`grid gap-3 sm:gap-6 ${isAdmin ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
        {(isAdmin ? adminQuickActions : tellerQuickActions).map((action) => {
          const Icon = action.icon;
          const isPrimary = 'primary' in action && action.primary;
          return (
            <Link
              key={action.label}
              href={action.href}
              className={`p-4 sm:p-6 rounded-xl shadow-sm transition-all flex flex-col items-center justify-center text-center ${
                isPrimary ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white hover:shadow-lg border hover:border-amber-500'
              }`}
            >
              <div className={`p-2 sm:p-3 mb-2 sm:mb-3 rounded-full ${isPrimary ? 'bg-white/10' : 'bg-amber-100'}`}>
                <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isPrimary ? 'text-white' : 'text-amber-600'}`} />
              </div>
              <span className={`font-semibold text-xs sm:text-sm ${isPrimary ? 'text-white' : 'text-zinc-700'}`}>{action.label}</span>
            </Link>
          );
        })}
      </div>

      {isAdmin && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
          <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 sm:h-16 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {adminStats?.recentActivity?.length ? (
                adminStats.recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <Link key={activity.orderId || index} href={`/orders/${activity.orderId}`} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 bg-gray-100 rounded-full shrink-0">
                          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-800 truncate">{activity.title}</p>
                          <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                        </div>
                        <p className="text-xs text-gray-400 self-start shrink-0">{activity.time}</p>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">No recent activity</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  prefix = '',
  loading,
}: {
  icon: LucideIcon;
  title: string;
  value?: number;
  prefix?: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 mr-2">
          <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{title}</p>
          {loading ? (
            <div className="h-7 sm:h-8 w-20 sm:w-24 bg-gray-200 rounded-md animate-pulse mt-1 sm:mt-2" />
          ) : (
            <p className="text-xl sm:text-3xl font-bold text-zinc-800 mt-1">
              {prefix}
              {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
            </p>
          )}
        </div>
        <div className="p-2 sm:p-3 rounded-full bg-amber-100 text-amber-600 shrink-0">
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </div>
  );
}
