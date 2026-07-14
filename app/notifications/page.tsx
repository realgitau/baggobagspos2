// app/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface NotificationRow {
  _id: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 mb-4">Notifications</h1>
      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : notifications.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications yet.</p>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {notifications.map((n) => (
            <Link
              key={n._id}
              href={n.link || '#'}
              className={`block p-4 hover:bg-gray-50 ${!n.read ? 'bg-amber-50' : ''}`}
            >
              <p className="text-sm text-zinc-800">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('en-KE')}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
