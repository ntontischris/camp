'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/use-organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Database } from '@/lib/types/database';

type Staff = Database['public']['Tables']['staff']['Row'];

const ROLES = [
  { value: 'director', label: 'Διευθυντής' },
  { value: 'coordinator', label: 'Συντονιστής' },
  { value: 'instructor', label: 'Εκπαιδευτής' },
  { value: 'counselor', label: 'Σύμβουλος' },
  { value: 'support', label: 'Υποστήριξη' },
  { value: 'volunteer', label: 'Εθελοντής' },
];

const ROLE_LABELS: Record<string, string> = Object.fromEntries(ROLES.map(r => [r.value, r.label]));

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentOrganization } = useOrganizations();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [editing, setEditing] = useState(false);

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (currentOrganization) {
      loadStaff();
    }
  }, [id, currentOrganization?.id]);

  const loadStaff = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .eq('organization_id', currentOrganization!.id)
        .is('deleted_at', null)
        .single();

      if (error) throw error;

      setStaff(data);
      populateForm(data);
    } catch (error: any) {
      console.error('Error loading staff:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: Staff) => {
    setFirstName(data.first_name);
    setLastName(data.last_name);
    setEmployeeCode(data.employee_code || '');
    setEmail(data.email || '');
    setPhone(data.phone || '');
    setRole(data.role || 'instructor');
    setDateOfBirth(data.date_of_birth || '');
    setHireDate(data.hire_date || '');
    setEmergencyContactName(data.emergency_contact_name || '');
    setEmergencyContactPhone(data.emergency_contact_phone || '');
  };

  const handleSave = async () => {
    if (!staff) return;

    if (!firstName.trim() || !lastName.trim()) {
      setError('Το όνομα και το επώνυμο είναι υποχρεωτικά.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('staff')
        .update({
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', staff.id);

      if (error) throw error;

      await loadStaff();
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating staff:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!staff) return;

    if (!confirm(`Είσαι σίγουρος ότι θέλεις να διαγράψεις το μέλος "${staff.first_name} ${staff.last_name}";`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', staff.id);

      if (error) throw error;

      router.push('/dashboard/staff');
      router.refresh();
    } catch (error: any) {
      console.error('Error deleting staff:', error);
      setError(error.message);
    }
  };

  const handleToggleActive = async () => {
    if (!staff) return;

    try {
      const { error } = await supabase
        .from('staff')
        .update({
          is_active: !staff.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staff.id);

      if (error) throw error;

      await loadStaff();
    } catch (error: any) {
      console.error('Error toggling active:', error);
      setError(error.message);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    if (staff) {
      populateForm(staff);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('el-GR');
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (error && !staff) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center text-gray-600">Το μέλος δεν βρέθηκε.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/dashboard/staff" className="text-sm text-primary-600 hover:text-primary-500">
          ← Πίσω στο Προσωπικό
        </Link>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
              {staff.first_name.charAt(0)}{staff.last_name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {staff.last_name} {staff.first_name}
              </h1>
              {staff.employee_code && (
                <p className="text-gray-500">Κωδικός: {staff.employee_code}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              staff.role === 'director' ? 'bg-purple-100 text-purple-800' :
              staff.role === 'coordinator' ? 'bg-blue-100 text-blue-800' :
              staff.role === 'instructor' ? 'bg-green-100 text-green-800' :
              staff.role === 'counselor' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ROLE_LABELS[staff.role || 'instructor']}
            </span>
            {!staff.is_active && (
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                Ανενεργό
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Στοιχεία Μέλους</CardTitle>
              {!editing && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Επεξεργασία
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {editing ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Όνομα *</label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Επώνυμο *</label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={saving} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Κωδικός Υπαλλήλου</label>
                    <Input value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} disabled={saving} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ρόλος</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      disabled={saving}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium">Επικοινωνία</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Email</label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Τηλέφωνο</label>
                      <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={saving} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium">Ημερομηνίες</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Ημ. Γέννησης</label>
                      <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Ημ. Πρόσληψης</label>
                      <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} disabled={saving} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="mb-3 text-sm font-medium">Έκτακτη Ανάγκη</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Όνομα Επαφής</label>
                      <Input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} disabled={saving} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-600">Τηλέφωνο Επαφής</label>
                      <Input type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} disabled={saving} />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Αποθήκευση...' : 'Αποθήκευση'}
                  </Button>
                  <Button variant="outline" onClick={cancelEdit} disabled={saving}>
                    Ακύρωση
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {staff.email && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Email</div>
                      <div className="mt-1 text-gray-900">{staff.email}</div>
                    </div>
                  )}
                  {staff.phone && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Τηλέφωνο</div>
                      <div className="mt-1 text-gray-900">{staff.phone}</div>
                    </div>
                  )}
                  {staff.date_of_birth && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Ημ. Γέννησης</div>
                      <div className="mt-1 text-gray-900">{formatDate(staff.date_of_birth)}</div>
                    </div>
                  )}
                  {staff.hire_date && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">Ημ. Πρόσληψης</div>
                      <div className="mt-1 text-gray-900">{formatDate(staff.hire_date)}</div>
                    </div>
                  )}
                </div>

                {(staff.emergency_contact_name || staff.emergency_contact_phone) && (
                  <div className="border-t pt-4">
                    <h4 className="mb-3 text-sm font-medium text-gray-900">Επικοινωνία Έκτακτης Ανάγκης</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      {staff.emergency_contact_name && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Όνομα</div>
                          <div className="mt-1 text-gray-900">{staff.emergency_contact_name}</div>
                        </div>
                      )}
                      {staff.emergency_contact_phone && (
                        <div>
                          <div className="text-sm font-medium text-gray-500">Τηλέφωνο</div>
                          <div className="mt-1 text-gray-900">{staff.emergency_contact_phone}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ενέργειες</CardTitle>
            <CardDescription>Διαχείριση μέλους</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleToggleActive}>
                {staff.is_active ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                Διαγραφή Μέλους
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
