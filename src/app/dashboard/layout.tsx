import { Navbar } from '@/components/navbar';
import { AIAssistant } from '@/components/ai/ai-assistant';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
      <AIAssistant />
    </div>
  );
}
