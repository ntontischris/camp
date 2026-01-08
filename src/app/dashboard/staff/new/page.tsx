'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ROLES = [
  { value: 'director', label: 'Διευθυντής' },
  { value: 'coordinator', label: 'Συντονιστής' },
  { value: 'instructor', label: 'Εκπαιδευτής' },
  { value: 'counselor', label: 'Σύμβουλος' },
  { value: 'support', label: 'Υποστήριξη' },
  { value: 'volunteer', label: 'Εθελοντής' },
];

export default function NewStaffPage() {
  const router = useRouter();
  const { currentOrganization, isLoading: orgLoading } = useOrganizations();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('instructor');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrganization) {
      setError('Δεν έχεις επιλέξει οργανισμό.');
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError('Το όνομα και το επώνυμο είναι υποχρεωτικά.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('staff')
        .insert({
          organization_id: currentOrganization.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          employee_code: employeeCode.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          role,
          date_of_birth: dateOfBirth || null,
          hire_date: hireDate || null,
          emergency_contact_name: emergencyContactName.trim() || null,
          emergency_contact_phone: emergencyContactPhone.trim() || null,
          is_active: true,
        });

      if (error) throw error;

      router.push('/dashboard/staff');
      router.refresh();
    } catch (error: any) {
      console.error('Error creating staff:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (orgLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">
          Δεν έχεις επιλέξει οργανισμό.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/staff" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στο Προσωπικό
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Νέο Μέλος Προσωπικού</h1>
        <p className="mt-2 text-gray-600">Πρόσθεσε ένα νέο μέλος στο προσωπικό</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Στοιχεία Μέλους</CardTitle>
          <CardDescription>Συμπλήρωσε τα βασικά στοιχεία</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Όνομα *
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="π.χ. Γιάννης"
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Επώνυμο *
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="π.χ. Παπαδόπουλος"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Κωδικός Υπαλλήλου
                </label>
                <Input
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  placeholder="π.χ. EMP-001"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Ρόλος
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  disabled={loading}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-900">Στοιχεία Επικοινωνίας</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Τηλέφωνο
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="69XXXXXXXX"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-900">Ημερομηνίες</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ημερομηνία Γέννησης
                  </label>
                  <Input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Ημερομηνία Πρόσληψης
                  </label>
                  <Input
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-t pt-6">
              <h3 className="mb-4 text-sm font-medium text-gray-900">Επικοινωνία Έκτακτης Ανάγκης</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Όνομα Επαφής
                  </label>
                  <Input
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="π.χ. Μαρία Παπαδοπούλου"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Τηλέφωνο Επαφής
                  </label>
                  <Input
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="69XXXXXXXX"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={loading}>
                {loading ? 'Δημιουργία...' : 'Δημιουργία Μέλους'}
              </Button>
              <Link href="/dashboard/staff">
                <Button type="button" variant="outline" disabled={loading}>
                  Ακύρωση
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
