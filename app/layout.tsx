// app/layout.tsx
import { Jost } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Header from '@/components/Header';
import AuthProvider from '@/components/AuthProvider';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';
import { CartProvider } from '@/context/CartContext';

const jost = Jost({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Baggo Bags POS',
  description: 'Point of Sale system for Baggo Bags Global Kenya',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body className={`${jost.className} bg-gray-50`}>
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <div className="flex-1 flex flex-col md:ml-64">
                <Header />
                <main className="flex-1 p-4 lg:p-6 pb-20 md:pb-6">{children}</main>
              </div>
              <BottomNav />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
