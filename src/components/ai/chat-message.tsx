'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  onConfirm?: () => void;
  onEdit?: () => void;
  isLoading?: boolean;
}

export function ChatMessage({ role, content, onConfirm, onEdit, isLoading }: ChatMessageProps) {
  const [showActions, setShowActions] = useState(false);

  // Check if message contains JSON action
  const hasAction = content.includes('```json') && content.includes('"action"');

  // Extract text before JSON
  const displayContent = content.replace(/```json[\s\S]*?```/g, '').trim();

  // Extract JSON for preview
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
  let actionPreview = null;
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      actionPreview = data;
    } catch {
      // Invalid JSON
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-3 p-4">
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm">AI</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex gap-3 p-4 ${role === 'user' ? 'bg-gray-50' : 'bg-white'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          role === 'user' ? 'bg-gray-200' : 'bg-primary-100'
        }`}
      >
        <span className="text-sm">{role === 'user' ? 'Εσύ' : 'AI'}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{displayContent}</p>

        {actionPreview && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-medium text-blue-800 mb-2">
              Προτεινόμενη ενέργεια: {getActionLabel(actionPreview.action)}
            </p>

            {actionPreview.items && (
              <div className="space-y-1">
                {actionPreview.items.slice(0, 5).map((item: { name?: string; first_name?: string; last_name?: string }, i: number) => (
                  <div key={i} className="text-xs text-blue-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    {item.name || `${item.first_name} ${item.last_name}`}
                  </div>
                ))}
                {actionPreview.items.length > 5 && (
                  <p className="text-xs text-blue-600">...και {actionPreview.items.length - 5} ακόμα</p>
                )}
              </div>
            )}

            {actionPreview.template && (
              <div className="text-xs text-blue-700">
                <p>Template: {actionPreview.template.name}</p>
                <p>{actionPreview.template.slots?.length || 0} slots</p>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <Button size="sm" onClick={onConfirm}>
                Δημιούργησε
              </Button>
              <Button size="sm" variant="outline" onClick={onEdit}>
                Επεξεργασία
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getActionLabel(action: string): string {
  switch (action) {
    case 'create_activities':
      return 'Δημιουργία Δραστηριοτήτων';
    case 'create_facilities':
      return 'Δημιουργία Εγκαταστάσεων';
    case 'create_staff':
      return 'Δημιουργία Προσωπικού';
    case 'create_template':
      return 'Δημιουργία Προτύπου Ημέρας';
    default:
      return action;
  }
}
