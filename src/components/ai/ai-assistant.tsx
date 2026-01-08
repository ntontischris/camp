'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ChatMessage } from './chat-message';
import { useOrganizations } from '@/hooks/use-organizations';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: `Γεια σου! Είμαι ο AI βοηθός του CampWise.

Μπορώ να σε βοηθήσω να ρυθμίσεις γρήγορα την κατασκήνωσή σου. Δοκίμασε να μου πεις:

- "Δημιούργησε 5 αθλητικές δραστηριότητες"
- "Έχω πισίνα, γήπεδο ποδοσφαίρου και αίθουσα χειροτεχνίας"
- "Θέλω 4 ομαδάρχες και 2 ναυαγοσώστες"
- "Φτιάξε ένα πρόγραμμα ημέρας από 9:00 έως 18:00"

Τι θέλεις να δημιουργήσουμε;`,
};

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { currentOrganization } = useOrganizations();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !currentOrganization) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: messages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
          organizationId: currentOrganization.id,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: data.message || 'Κάτι πήγε στραβά. Δοκίμασε ξανά.',
          },
        ]);
      } else {
        let content = data.message;

        // Clean the message - remove JSON blocks for cleaner display
        content = content.replace(/```json[\s\S]*?```/g, '').trim();

        // Add creation result info if available
        if (data.creationResult?.success) {
          const count = data.creationResult.created || data.creationResult.templateId ? 1 : 0;
          content += `\n\n✅ Δημιουργήθηκαν επιτυχώς ${count > 0 ? count : ''} στοιχεία! Ανανέωσε τη σελίδα για να τα δεις.`;
        } else if (data.creationResult?.error) {
          content += `\n\n❌ Σφάλμα κατά τη δημιουργία: ${data.creationResult.error}`;
        } else if (data.actionData && !data.creationResult) {
          // AI returned action data but it wasn't executed - tell user
          content += `\n\n💡 Πες "ναι" ή "δημιούργησε" για να τα δημιουργήσω.`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Δεν μπόρεσα να επικοινωνήσω με τον server. Δοκίμασε ξανά.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleConfirm = () => {
    sendMessage('Ναι, δημιούργησέ τα');
  };

  const handleEdit = () => {
    setInput('Θέλω να αλλάξω: ');
    inputRef.current?.focus();
  };

  if (!currentOrganization) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-primary-600 hover:bg-primary-700'
        }`}
      >
        {isOpen ? (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-primary-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-sm">AI</span>
                </div>
                <div>
                  <h3 className="font-semibold">CampWise Assistant</h3>
                  <p className="text-xs text-primary-100">Βοηθός ρύθμισης</p>
                </div>
              </div>
              <button
                onClick={() => setMessages([WELCOME_MESSAGE])}
                className="text-xs text-primary-200 hover:text-white"
              >
                Νέα συζήτηση
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                onConfirm={handleConfirm}
                onEdit={handleEdit}
              />
            ))}
            {isLoading && <ChatMessage role="assistant" content="" isLoading />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Γράψε ένα μήνυμα..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </Button>
            </div>
          </form>
        </Card>
      )}
    </>
  );
}
