'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const supabase = createClient();

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsValidSession(!!session);
    };
    checkSession();
  }, [supabase.auth]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Οι κωδικοί δεν ταιριάζουν.');
      return;
    }

    if (password.length < 8) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (isValidSession === null) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Ενημέρωση Κωδικού</CardTitle>
          <CardDescription>Φόρτωση...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No valid session - invalid or expired link
  if (!isValidSession) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Μη Έγκυρος Σύνδεσμος</CardTitle>
          <CardDescription>
            Ο σύνδεσμος επαναφοράς έχει λήξει ή δεν είναι έγκυρος
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
            Ο σύνδεσμος επαναφοράς κωδικού μπορεί να έχει λήξει. Δοκίμασε να ζητήσεις νέο σύνδεσμο.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Link href="/auth/reset-password" className="w-full">
            <Button className="w-full">
              Νέα Αίτηση Επαναφοράς
            </Button>
          </Link>
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full">
              Πίσω στη Σύνδεση
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Success state
  if (success) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Επιτυχία!</CardTitle>
          <CardDescription>
            Ο κωδικός σου ενημερώθηκε
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
            Ο κωδικός σου άλλαξε επιτυχώς. Θα ανακατευθυνθείς στο dashboard...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Νέος Κωδικός</CardTitle>
        <CardDescription>
          Εισήγαγε τον νέο κωδικό σου
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleUpdatePassword}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Νέος Κωδικός
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Τουλάχιστον 8 χαρακτήρες"
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Επιβεβαίωση Κωδικού
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Επανέλαβε τον κωδικό"
              required
              minLength={8}
              disabled={loading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Ενημέρωση...' : 'Ενημέρωση Κωδικού'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
