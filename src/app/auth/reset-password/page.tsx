'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Έλεγξε το email σου</CardTitle>
          <CardDescription>
            Στείλαμε ένα email στο {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            Αν υπάρχει λογαριασμός με αυτό το email, θα λάβεις οδηγίες για να επαναφέρεις τον κωδικό σου.
          </div>
          <p className="text-sm text-gray-600">
            Δεν έλαβες email; Έλεγξε τον φάκελο spam ή{' '}
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              δοκίμασε ξανά
            </button>
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full">
              Πίσω στη Σύνδεση
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Επαναφορά Κωδικού</CardTitle>
        <CardDescription>
          Εισήγαγε το email σου για να λάβεις οδηγίες επαναφοράς
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleResetPassword}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Αποστολή...' : 'Αποστολή Οδηγιών'}
          </Button>
          <Link href="/auth/login" className="text-center text-sm text-gray-600 hover:text-primary-600">
            Πίσω στη Σύνδεση
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
