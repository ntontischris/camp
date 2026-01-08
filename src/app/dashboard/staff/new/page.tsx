'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardFooter } from '@/components/ui/card';
import { PageHeader, FormSection, FieldHelp, InfoBox } from '@/components/ui/page-header';

const ROLES = [
  { value: 'director', label: 'Διευθυντής', icon: '👔', description: 'Γενική διεύθυνση και επίβλεψη' },
  { value: 'coordinator', label: 'Συντονιστής', icon: '📋', description: 'Συντονισμός προγράμματος και ομάδων' },
  { value: 'instructor', label: 'Εκπαιδευτής', icon: '🏃', description: 'Διεξαγωγή δραστηριοτήτων' },
  { value: 'counselor', label: 'Σύμβουλος', icon: '🤝', description: 'Φροντίδα και υποστήριξη παιδιών' },
  { value: 'support', label: 'Υποστήριξη', icon: '🛠️', description: 'Διοικητική υποστήριξη' },
  { value: 'volunteer', label: 'Εθελοντής', icon: '💪', description: 'Εθελοντική συνεισφορά' },
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
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">
          Δεν έχεις επιλέξει οργανισμό.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/dashboard/staff" className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500 mb-4">
        ← Πίσω στο Προσωπικό
      </Link>

      <PageHeader
        title="Νέο Μέλος Προσωπικού"
        description="Πρόσθεσε έναν εκπαιδευτή, σύμβουλο ή άλλο μέλος"
        icon="👤"
        helpText="Το Προσωπικό είναι οι άνθρωποι που διεξάγουν τις δραστηριότητες και φροντίζουν τα παιδιά. Κάθε μέλος μπορεί να αναλάβει δραστηριότητες στο πρόγραμμα, ανάλογα με τις ειδικότητές του."
        tips={[
          'Ο ρόλος καθορίζει τι μπορεί να κάνει το μέλος στο σύστημα',
          'Το τηλέφωνο έκτακτης ανάγκης είναι σημαντικό για ασφάλεια',
          'Μπορείς να συνδέσεις το προσωπικό με συγκεκριμένες δραστηριότητες αργότερα'
        ]}
        steps={[
          { title: 'Βασικά στοιχεία', description: 'Όνομα, ρόλος, κωδικός' },
          { title: 'Επικοινωνία', description: 'Email και τηλέφωνο' },
          { title: 'Επαφή έκτακτης ανάγκης', description: 'Για περιπτώσεις ανάγκης' }
        ]}
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
            ⚠️ {error}
          </div>
        )}

        <FormSection
          title="Βασικές Πληροφορίες"
          description="Όνομα και ρόλος του μέλους"
          icon="📝"
          required
        >
          <div className="space-y-4">
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Κωδικός Υπαλλήλου
              </label>
              <Input
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="π.χ. EMP-001"
                disabled={loading}
                className="max-w-xs"
              />
              <FieldHelp
                text="Εσωτερικός κωδικός για αναγνώριση"
                example="EMP-001, ST-12, INS-05"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Ρόλος"
          description="Τι θέση έχει στην κατασκήνωση"
          icon="🎭"
          required
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  role === r.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={loading}
                  className="sr-only"
                />
                <span className="text-xl flex-shrink-0">{r.icon}</span>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-900 block">{r.label}</span>
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                </div>
              </label>
            ))}
          </div>
          <FieldHelp text="Ο ρόλος καθορίζει τις αρμοδιότητες και τα δικαιώματα" />
        </FormSection>

        <FormSection
          title="Στοιχεία Επικοινωνίας"
          description="Email και τηλέφωνο"
          icon="📱"
        >
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
              <FieldHelp text="Για αποστολή προγράμματος και ενημερώσεων" />
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
              <FieldHelp text="Κινητό τηλέφωνο για άμεση επικοινωνία" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Ημερομηνίες"
          description="Στοιχεία για το αρχείο"
          icon="📅"
        >
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
              <FieldHelp text="Προαιρετικό - για το αρχείο" />
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
              <FieldHelp text="Πότε ξεκίνησε η συνεργασία" />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Επικοινωνία Έκτακτης Ανάγκης"
          description="Σε περίπτωση που χρειαστεί"
          icon="🆘"
        >
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
              <FieldHelp text="Συγγενής ή άτομο εμπιστοσύνης" />
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
              <FieldHelp text="Τηλέφωνο για έκτακτες περιπτώσεις" />
            </div>
          </div>

          <InfoBox type="warning" title="Σημαντικό">
            Η επαφή έκτακτης ανάγκης χρησιμοποιείται μόνο σε σοβαρές περιπτώσεις
            (ατύχημα, ασθένεια κλπ). Βεβαιώσου ότι το άτομο γνωρίζει ότι έχει οριστεί ως επαφή.
          </InfoBox>
        </FormSection>

        <InfoBox type="tip" title="Τι γίνεται μετά;">
          Αφού δημιουργήσεις το μέλος, μπορείς να το αναθέσεις σε <strong>δραστηριότητες</strong>
          και να δεις το προσωπικό του πρόγραμμα. Επίσης, μπορείς να ορίσεις τις
          <strong> ειδικότητές</strong> του (π.χ. ναυαγοσώστης, αθλητικός εκπαιδευτής).
        </InfoBox>

        <Card className="mt-6">
          <CardFooter className="flex justify-between py-4">
            <Link href="/dashboard/staff">
              <Button type="button" variant="outline" disabled={loading}>
                Ακύρωση
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? 'Δημιουργία...' : '✓ Δημιουργία Μέλους'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
