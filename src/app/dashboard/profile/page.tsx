'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      // Update user metadata
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
        },
      });

      if (metadataError) throw metadataError;

      // Update email if changed
      if (email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email,
        });

        if (emailError) throw emailError;

        setProfileSuccess('Τα στοιχεία ενημερώθηκαν. Θα λάβεις email για επιβεβαίωση του νέου email.');
      } else {
        setProfileSuccess('Τα στοιχεία ενημερώθηκαν επιτυχώς.');
      }

      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
      setProfileError(errorMessage);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Οι νέοι κωδικοί δεν ταιριάζουν.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Ο νέος κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες.');
      setPasswordLoading(false);
      return;
    }

    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError('Λάθος τρέχων κωδικός.');
        setPasswordLoading(false);
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordSuccess('Ο κωδικός ενημερώθηκε επιτυχώς.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Κάτι πήγε στραβά. Δοκίμασε ξανά.';
      setPasswordError(errorMessage);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Δεν είσαι συνδεδεμένος.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Προφίλ</h1>
        <p className="mt-2 text-gray-600">Διαχειρίσου τα στοιχεία του λογαριασμού σου</p>
      </div>

      <div className="space-y-6">
        {/* Profile Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Βασικά Στοιχεία</CardTitle>
            <CardDescription>
              Ενημέρωσε το όνομα και το email σου
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                  {profileSuccess}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Ονοματεπώνυμο
                </label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Γιάννης Παπαδόπουλος"
                  disabled={profileLoading}
                />
              </div>

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
                  disabled={profileLoading}
                />
                {email !== user.email && (
                  <p className="text-xs text-amber-600">
                    Αλλάζοντας το email θα χρειαστεί επιβεβαίωση
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? 'Αποθήκευση...' : 'Αποθήκευση Αλλαγών'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle>Αλλαγή Κωδικού</CardTitle>
            <CardDescription>
              Ενημέρωσε τον κωδικό πρόσβασης
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {passwordError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="currentPassword" className="text-sm font-medium">
                  Τρέχων Κωδικός
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Εισήγαγε τον τρέχοντα κωδικό"
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  Νέος Κωδικός
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Τουλάχιστον 8 χαρακτήρες"
                  required
                  minLength={8}
                  disabled={passwordLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Επιβεβαίωση Νέου Κωδικού
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Επανέλαβε τον νέο κωδικό"
                  required
                  minLength={8}
                  disabled={passwordLoading}
                />
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Ενημέρωση...' : 'Ενημέρωση Κωδικού'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Πληροφορίες Λογαριασμού</CardTitle>
            <CardDescription>
              Λεπτομέρειες του λογαριασμού σου
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-gray-500">ID Χρήστη</span>
              <span className="text-sm font-mono text-gray-700">{user.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-gray-500">Εγγραφή</span>
              <span className="text-sm text-gray-700">
                {new Date(user.created_at).toLocaleDateString('el-GR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-gray-500">Τελευταία σύνδεση</span>
              <span className="text-sm text-gray-700">
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleDateString('el-GR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-sm text-gray-500">Email επιβεβαιωμένο</span>
              <span className="text-sm text-gray-700">
                {user.email_confirmed_at ? (
                  <span className="text-green-600">Ναι</span>
                ) : (
                  <span className="text-amber-600">Όχι</span>
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
