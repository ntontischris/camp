'use client';

import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { AIAssistant } from '@/components/ai/ai-assistant';
import { QuickCreateProvider, useQuickCreate } from '@/components/quick-create';
import { CommandPalette } from '@/components/command-palette';
import { KeyboardShortcutsModal } from '@/components/keyboard-shortcuts';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { openModal } = useQuickCreate();

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30" />

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main Content */}
        <main className="lg:pl-64 min-h-screen">
          {/* Top Bar with Breadcrumbs (Desktop) */}
          <div className="hidden lg:block sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="px-6 py-3 flex items-center justify-between">
              <Breadcrumbs />
              <button
                onClick={() => {}}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Άνοιγμα αναζήτησης (⌘K)"
              >
                <span>🔍</span>
                <span>Αναζήτηση...</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-white rounded border">⌘K</kbd>
              </button>
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

      {/* Command Palette */}
      <CommandPalette onOpenQuickCreate={openModal} />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal />
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleCreateSuccess = (type: string, data: any) => {
    // Refresh the current page to show new data
    router.refresh();
  };

  return (
    <QuickCreateProvider onCreateSuccess={handleCreateSuccess}>
      <DashboardContent>{children}</DashboardContent>
    </QuickCreateProvider>
  );
}
