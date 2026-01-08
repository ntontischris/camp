'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

type Step = 'welcome' | 'organization' | 'session' | 'groups' | 'complete';

const COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6',
];

const GROUP_PRESETS = [
  ['Αετοί', 'Λιοντάρια', 'Δελφίνια', 'Τίγρεις'],
  ['Ομάδα Α', 'Ομάδα Β', 'Ομάδα Γ', 'Ομάδα Δ'],
  ['Μικροί', 'Μεσαίοι', 'Μεγάλοι'],
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState<Step>('welcome');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Organization data
  const [orgName, setOrgName] = useState('');
  const [orgType, setOrgType] = useState<'summer_camp' | 'kdap' | 'sports' | 'other'>('summer_camp');

  // Session data
  const [sessionName, setSessionName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Groups data
  const [groupCount, setGroupCount] = useState(4);
  const [groupNames, setGroupNames] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  // Created IDs
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Redirect if not authenticated
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-600">Φόρτωση...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    router.push('/auth/login');
    return null;
  }

  const handleCreateOrganization = async () => {
    if (!orgName.trim() || !user) {
      setError('Το όνομα οργανισμού είναι υποχρεωτικό.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const slug = orgName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 50);

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          slug: `${slug}-${Date.now()}`,
          settings: { type: orgType },
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create user record
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || null,
      }, { onConflict: 'id' });

      // Add user as owner
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      setOrganizationId(org.id);
      setStep('session');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Κάτι πήγε στραβά.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionName.trim() || !startDate || !endDate || !organizationId) {
      setError('Όλα τα πεδία είναι υποχρεωτικά.');
      return;
    }

    if (startDate > endDate) {
      setError('Η ημερομηνία λήξης πρέπει να είναι μετά την έναρξη.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          organization_id: organizationId,
          name: sessionName.trim(),
          start_date: startDate,
          end_date: endDate,
          status: 'draft',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      setSessionId(session.id);
      setStep('groups');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Κάτι πήγε στραβά.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroups = async () => {
    if (!sessionId || groupNames.length === 0) {
      setError('Επίλεξε ονόματα ομάδων.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const groupsToInsert = groupNames.slice(0, groupCount).map((name, index) => ({
        session_id: sessionId,
        name,
        color: COLORS[index % COLORS.length],
        is_active: true,
      }));

      const { error: groupsError } = await supabase
        .from('groups')
        .insert(groupsToInsert);

      if (groupsError) throw groupsError;

      setStep('complete');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Κάτι πήγε στραβά.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetIndex: number) => {
    setSelectedPreset(presetIndex);
    setGroupNames(GROUP_PRESETS[presetIndex]);
    setGroupCount(GROUP_PRESETS[presetIndex].length);
  };

  const handleSkipGroups = () => {
    setStep('complete');
  };

  const handleComplete = () => {
    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {['welcome', 'organization', 'session', 'groups', 'complete'].map((s, i) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-colors ${
                  ['welcome', 'organization', 'session', 'groups', 'complete'].indexOf(step) >= i
                    ? 'bg-primary-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            Βήμα {['welcome', 'organization', 'session', 'groups', 'complete'].indexOf(step) + 1} από 5
          </p>
        </div>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <Card>
            <CardHeader className="text-center">
              <div className="text-5xl mb-4">🏕️</div>
              <CardTitle className="text-2xl">Καλωσήρθες στο CampWise!</CardTitle>
              <CardDescription className="text-base mt-2">
                Η πλατφόρμα που κάνει τη διαχείριση κατασκήνωσης εύκολη
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Πώς λειτουργεί:</h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">1</span>
                    <span><strong>Οργανισμός</strong> - Η κατασκήνωσή σου</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">2</span>
                    <span><strong>Περίοδος</strong> - Οι ημερομηνίες λειτουργίας</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">3</span>
                    <span><strong>Ομάδες</strong> - Αετοί, Λιοντάρια, κλπ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">4</span>
                    <span><strong>Δραστηριότητες</strong> - Κολύμπι, Χειροτεχνία, κλπ</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0">5</span>
                    <span><strong>Πρόγραμμα</strong> - Αυτόματη δημιουργία!</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">💡 Tip</h3>
                <p className="text-sm text-green-800">
                  Μετά την αρχική ρύθμιση, ο <strong>AI βοηθός</strong> θα σε βοηθήσει να δημιουργήσεις
                  δραστηριότητες, εγκαταστάσεις και προσωπικό με απλή συζήτηση!
                </p>
              </div>

              <Button className="w-full" size="lg" onClick={() => setStep('organization')}>
                Ας ξεκινήσουμε!
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Organization */}
        {step === 'organization' && (
          <Card>
            <CardHeader>
              <CardTitle>Δημιουργία Οργανισμού</CardTitle>
              <CardDescription>
                Ο οργανισμός είναι η κατασκήνωσή σου - περιέχει όλα τα δεδομένα
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Όνομα Κατασκήνωσης *</label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="π.χ. Κατασκήνωση Αγίας Παρασκευής"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Τύπος</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'summer_camp', label: 'Θερινή Κατασκήνωση', icon: '🏕️' },
                    { value: 'kdap', label: 'ΚΔΑΠ', icon: '🏫' },
                    { value: 'sports', label: 'Αθλητικό Camp', icon: '⚽' },
                    { value: 'other', label: 'Άλλο', icon: '📋' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setOrgType(type.value as typeof orgType)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        orgType === type.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      <span className="text-xl mr-2">{type.icon}</span>
                      <span className="text-sm">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('welcome')} disabled={loading}>
                  Πίσω
                </Button>
                <Button className="flex-1" onClick={handleCreateOrganization} disabled={loading}>
                  {loading ? 'Δημιουργία...' : 'Συνέχεια'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Session */}
        {step === 'session' && (
          <Card>
            <CardHeader>
              <CardTitle>Δημιουργία Περιόδου</CardTitle>
              <CardDescription>
                Η περίοδος είναι το χρονικό διάστημα λειτουργίας (π.χ. Ιούλιος 2025)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Όνομα Περιόδου *</label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="π.χ. Καλοκαίρι 2025 - Α' Περίοδος"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ημ. Έναρξης *</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ημ. Λήξης *</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('organization')} disabled={loading}>
                  Πίσω
                </Button>
                <Button className="flex-1" onClick={handleCreateSession} disabled={loading}>
                  {loading ? 'Δημιουργία...' : 'Συνέχεια'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Groups */}
        {step === 'groups' && (
          <Card>
            <CardHeader>
              <CardTitle>Δημιουργία Ομάδων</CardTitle>
              <CardDescription>
                Οι ομάδες είναι τα γκρουπ κατασκηνωτών (π.χ. Αετοί, Λιοντάρια)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Επίλεξε έτοιμα ονόματα:</label>
                <div className="space-y-2">
                  {GROUP_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePresetSelect(index)}
                      className={`w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedPreset === index
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      disabled={loading}
                    >
                      <div className="flex flex-wrap gap-2">
                        {preset.map((name, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {groupNames.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <strong>Επιλεγμένες ομάδες:</strong> {groupNames.join(', ')}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep('session')} disabled={loading}>
                  Πίσω
                </Button>
                <Button variant="ghost" onClick={handleSkipGroups} disabled={loading}>
                  Παράλειψη
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreateGroups}
                  disabled={loading || groupNames.length === 0}
                >
                  {loading ? 'Δημιουργία...' : 'Συνέχεια'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <Card>
            <CardHeader className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <CardTitle className="text-2xl">Είσαι έτοιμος!</CardTitle>
              <CardDescription className="text-base mt-2">
                Η βασική ρύθμιση ολοκληρώθηκε
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-medium text-green-900 mb-2">✅ Τι δημιουργήθηκε:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Οργανισμός: <strong>{orgName}</strong></li>
                  <li>• Περίοδος: <strong>{sessionName}</strong></li>
                  {groupNames.length > 0 && (
                    <li>• Ομάδες: <strong>{groupNames.join(', ')}</strong></li>
                  )}
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">📋 Επόμενα βήματα:</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>1. Δημιούργησε <strong>Δραστηριότητες</strong> (Κολύμπι, Χειροτεχνία, κλπ)</p>
                  <p>2. Πρόσθεσε <strong>Εγκαταστάσεις</strong> (Πισίνα, Γήπεδο, κλπ)</p>
                  <p>3. Καταχώρησε το <strong>Προσωπικό</strong></p>
                  <p>4. Φτιάξε <strong>Πρότυπο Ημέρας</strong></p>
                  <p>5. Δημιούργησε αυτόματα το <strong>Πρόγραμμα</strong>!</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-medium text-purple-900 mb-2">🤖 Χρησιμοποίησε τον AI βοηθό!</h3>
                <p className="text-sm text-purple-800">
                  Κάνε κλικ στο κουμπί chat κάτω δεξιά και πες του τι χρειάζεσαι.
                  Π.χ. &quot;Δημιούργησε 5 αθλητικές δραστηριότητες&quot;
                </p>
              </div>

              <Button className="w-full" size="lg" onClick={handleComplete}>
                Πάμε στο Dashboard!
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
