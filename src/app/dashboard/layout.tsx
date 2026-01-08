'use client';

import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AIAssistant } from '@/components/ai/ai-assistant';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30" />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        {/* Top Bar with Breadcrumbs (Desktop) */}
        <div className="hidden lg:block sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
          <div className="px-6 py-3">
            <Breadcrumbs />
          </div>
        </div>

        {/* Mobile Header Spacer */}
        <div className="lg:hidden h-14" />

        {/* Page Content */}
        <div className="pb-20 lg:pb-0">
          {children}
        </div>

        {/* Mobile Bottom Nav Spacer */}
        <div className="lg:hidden h-16" />
      </main>

      {/* AI Assistant - adjusted position for sidebar */}
      <div className="lg:pl-64">
        <AIAssistant />
      </div>
    </div>
  );
}
