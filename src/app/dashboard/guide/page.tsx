'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: string;
  href: string;
  duration: string;
  details: string[];
  example?: {
    title: string;
    items: string[];
  };
  tips?: string[];
}

const SETUP_STEPS: Step[] = [
  {
    id: 1,
    title: 'Δημιουργία Περιόδου',
    description: 'Όρισε το χρονικό διάστημα λειτουργίας του camp',
    icon: '📅',
    href: '/dashboard/sessions/new',
    duration: '2 λεπτά',
    details: [
      'Η Περίοδος είναι το θεμέλιο όλων - καθορίζει πότε λειτουργεί το camp',
      'Μπορείς να έχεις πολλές περιόδους (1η, 2η, 3η περίοδος καλοκαιριού)',
      'Κάθε περίοδος έχει τις δικές της ομάδες και πρόγραμμα',
    ],
    example: {
      title: 'Παράδειγμα Περιόδων',
      items: [
        '1η Θερινή Περίοδος: 1-15 Ιουλίου 2026',
        '2η Θερινή Περίοδος: 16-31 Ιουλίου 2026',
        '3η Θερινή Περίοδος: 1-15 Αυγούστου 2026',
      ],
    },
    tips: [
      'Ξεκίνα με μία περίοδο και πρόσθεσε περισσότερες αργότερα',
      'Η κατάσταση "Πρόχειρο" σημαίνει ότι δουλεύεις ακόμα πάνω της',
    ],
  },
  {
    id: 2,
    title: 'Προσθήκη Χώρων',
    description: 'Καταχώρησε τους χώρους όπου γίνονται δραστηριότητες',
    icon: '🏠',
    href: '/dashboard/facilities/new',
    duration: '5-10 λεπτά',
    details: [
      'Οι Χώροι είναι τα σημεία της κατασκήνωσης: γήπεδα, αίθουσες, πισίνα',
      'Σημείωσε αν είναι εσωτερικοί ή υπαίθριοι (για περίπτωση βροχής)',
      'Η χωρητικότητα βοηθάει να μην υπερφορτωθεί ένας χώρος',
    ],
    example: {
      title: 'Παράδειγμα Χώρων',
      items: [
        'Πισίνα - Υπαίθριος - 30 άτομα',
        'Γήπεδο Ποδοσφαίρου - Υπαίθριος - 40 άτομα',
        'Γήπεδο Μπάσκετ - Υπαίθριος - 20 άτομα',
        'Αίθουσα Χειροτεχνίας - Εσωτερικός - 25 άτομα',
        'Αμφιθέατρο - Εσωτερικός - 100 άτομα',
        'Αίθουσα Μουσικής - Εσωτερικός - 20 άτομα',
      ],
    },
    tips: [
      'Πρόσθεσε όλους τους χώρους που χρησιμοποιείς συχνά',
      'Οι εσωτερικοί χώροι είναι σημαντικοί για εναλλακτικές σε κακοκαιρία',
    ],
  },
  {
    id: 3,
    title: 'Προσθήκη Δραστηριοτήτων',
    description: 'Καταχώρησε τις δραστηριότητες που προσφέρει το camp',
    icon: '⚽',
    href: '/dashboard/activities/new',
    duration: '10-15 λεπτά',
    details: [
      'Οι Δραστηριότητες είναι αυτές που κάνουν τα παιδιά: αθλήματα, τέχνες, παιχνίδια',
      'Κάθε δραστηριότητα έχει διάρκεια και ελάχιστο/μέγιστο αριθμό συμμετεχόντων',
      'Η ένταση (ήπια/μέτρια/έντονη) βοηθάει στο σωστό προγραμματισμό',
    ],
    example: {
      title: 'Παράδειγμα Δραστηριοτήτων',
      items: [
        'Ποδόσφαιρο - 60 λεπτά - Έντονη - 10-22 άτομα',
        'Κολύμβηση - 45 λεπτά - Μέτρια - 8-15 άτομα',
        'Χειροτεχνία - 60 λεπτά - Ήπια - 10-25 άτομα',
        'Θέατρο - 90 λεπτά - Ήπια - 15-30 άτομα',
        'Τοξοβολία - 45 λεπτά - Μέτρια - 6-12 άτομα',
        'Επιτραπέζια - 45 λεπτά - Ήπια - 4-20 άτομα',
      ],
    },
    tips: [
      'Χρησιμοποίησε διαφορετικά χρώματα για εύκολη αναγνώριση στο πρόγραμμα',
      'Η ένταση βοηθάει να μην έχεις 2 έντονες δραστηριότητες στη σειρά',
    ],
  },
  {
    id: 4,
    title: 'Προσθήκη Προσωπικού',
    description: 'Καταχώρησε τους εκπαιδευτές και το προσωπικό',
    icon: '👥',
    href: '/dashboard/staff/new',
    duration: '10-15 λεπτά',
    details: [
      'Το Προσωπικό είναι οι εκπαιδευτές, σύμβουλοι και υποστηρικτικοί',
      'Κάθε μέλος μπορεί να αναλάβει συγκεκριμένες δραστηριότητες',
      'Ο ρόλος καθορίζει τις αρμοδιότητες (διευθυντής, εκπαιδευτής, σύμβουλος)',
    ],
    example: {
      title: 'Παράδειγμα Προσωπικού',
      items: [
        'Γιάννης Παπαδόπουλος - Εκπαιδευτής - Αθλητικά',
        'Μαρία Κωνσταντίνου - Εκπαιδεύτρια - Κολύμβηση (Ναυαγοσώστρια)',
        'Νίκος Αντωνίου - Εκπαιδευτής - Τέχνες & Χειροτεχνία',
        'Ελένη Δημητρίου - Σύμβουλος - Ομάδα Αετών',
        'Κώστας Γεωργίου - Συντονιστής - Πρόγραμμα',
      ],
    },
    tips: [
      'Πρόσθεσε τηλέφωνο έκτακτης ανάγκης για κάθε μέλος',
      'Οι ειδικότητες βοηθούν στη σωστή ανάθεση δραστηριοτήτων',
    ],
  },
  {
    id: 5,
    title: 'Δημιουργία Ομάδων',
    description: 'Δημιούργησε τις ομάδες κατασκηνωτών',
    icon: '👨‍👩‍👧‍👦',
    href: '/dashboard/groups/new',
    duration: '5 λεπτά',
    details: [
      'Οι Ομάδες είναι τα σύνολα παιδιών που κάνουν μαζί τις δραστηριότητες',
      'Κάθε ομάδα ανήκει σε μια συγκεκριμένη περίοδο',
      'Μπορείς να ορίσεις ηλικιακό εύρος και χωρητικότητα',
    ],
    example: {
      title: 'Παράδειγμα Ομάδων',
      items: [
        'Αετοί - 8-10 ετών - 20 παιδιά - Μικτή',
        'Λιοντάρια - 11-13 ετών - 22 παιδιά - Μικτή',
        'Δελφίνια - 8-10 ετών - 18 παιδιά - Κορίτσια',
        'Τίγρεις - 11-13 ετών - 20 παιδιά - Αγόρια',
      ],
    },
    tips: [
      'Χρησιμοποίησε ξεχωριστά χρώματα για κάθε ομάδα',
      'Τα διασκεδαστικά ονόματα αρέσουν στα παιδιά!',
    ],
  },
  {
    id: 6,
    title: 'Δημιουργία Προτύπου Ημέρας',
    description: 'Όρισε τη δομή μιας τυπικής ημέρας',
    icon: '📄',
    href: '/dashboard/templates/new',
    duration: '10 λεπτά',
    details: [
      'Το Πρότυπο Ημέρας καθορίζει τη δομή: πότε είναι οι δραστηριότητες, τα γεύματα, τα διαλείμματα',
      'Μπορείς να έχεις διαφορετικά πρότυπα: Κανονική Ημέρα, Μισή Ημέρα, Εκδρομή',
      'Κάθε πρότυπο έχει χρονοθυρίδες (slots) με ώρες',
    ],
    example: {
      title: 'Παράδειγμα Προτύπου "Κανονική Ημέρα"',
      items: [
        '08:00-08:30 - Πρωινό',
        '08:30-09:30 - Δραστηριότητα 1',
        '09:30-10:30 - Δραστηριότητα 2',
        '10:30-11:00 - Διάλειμμα',
        '11:00-12:00 - Δραστηριότητα 3',
        '12:00-13:00 - Δραστηριότητα 4',
        '13:00-14:00 - Μεσημεριανό',
        '14:00-15:00 - Ξεκούραση',
        '15:00-16:00 - Δραστηριότητα 5',
        '16:00-17:00 - Δραστηριότητα 6',
        '17:00-17:30 - Ελεύθερος χρόνος',
      ],
    },
    tips: [
      'Το πρότυπο "Κανονική Ημέρα" μπορεί να οριστεί ως προεπιλογή',
      'Φτιάξε και ένα "Μισή Ημέρα" για αφίξεις/αναχωρήσεις',
    ],
  },
  {
    id: 7,
    title: 'Ορισμός Περιορισμών (Προαιρετικό)',
    description: 'Πρόσθεσε κανόνες για το πρόγραμμα',
    icon: '⚡',
    href: '/dashboard/constraints/new',
    duration: '5-10 λεπτά',
    details: [
      'Οι Περιορισμοί είναι κανόνες που πρέπει να τηρούνται στο πρόγραμμα',
      'Μπορεί να είναι Αυστηροί (απόλυτοι) ή Ευέλικτοι (προτιμήσεις)',
      'Βοηθούν στη δημιουργία ρεαλιστικού προγράμματος',
    ],
    example: {
      title: 'Παράδειγμα Περιορισμών',
      items: [
        'Κολύμβηση μόνο 10:00-12:00 (Αυστηρός)',
        'Πισίνα: μόνο 1 ομάδα κάθε φορά (Αυστηρός)',
        '30 λεπτά διάλειμμα μετά το μεσημεριανό (Αυστηρός)',
        'Μετά από έντονη, ακολουθεί ήπια δραστηριότητα (Ευέλικτος)',
        'Μέγιστο 4 αναθέσεις ανά εκπαιδευτή/ημέρα (Ευέλικτος)',
      ],
    },
    tips: [
      'Ξεκίνα με τους βασικούς περιορισμούς ασφαλείας',
      'Οι περιορισμοί βελτιώνουν την ποιότητα του αυτόματου προγράμματος',
    ],
  },
  {
    id: 8,
    title: 'Δημιουργία Προγράμματος',
    description: 'Φτιάξε το πρόγραμμα της εβδομάδας',
    icon: '📊',
    href: '/dashboard/schedule',
    duration: '15-30 λεπτά',
    details: [
      'Τώρα είσαι έτοιμος να φτιάξεις το πρόγραμμα!',
      'Επίλεξε περίοδο και ημερομηνία για να δεις το πλέγμα',
      'Κάνε κλικ σε ένα κελί για να προσθέσεις δραστηριότητα',
      'Μπορείς να χρησιμοποιήσεις την αυτόματη δημιουργία με AI',
    ],
    example: {
      title: 'Παράδειγμα Προγράμματος Δευτέρας',
      items: [
        '08:30-09:30: Αετοί→Ποδόσφαιρο, Λιοντάρια→Κολύμβηση',
        '09:30-10:30: Αετοί→Χειροτεχνία, Λιοντάρια→Τοξοβολία',
        '11:00-12:00: Αετοί→Κολύμβηση, Λιοντάρια→Θέατρο',
        '12:00-13:00: Αετοί→Μουσική, Λιοντάρια→Ποδόσφαιρο',
      ],
    },
    tips: [
      'Χρησιμοποίησε τα φίλτρα για να δεις μόνο μία ομάδα',
      'Οι συγκρούσεις εμφανίζονται με κόκκινο χρώμα',
      'Μπορείς να σύρεις δραστηριότητες για να τις μετακινήσεις',
    ],
  },
];

const WORKFLOW_DIAGRAM = [
  { step: 1, name: 'Περίοδος', icon: '📅' },
  { step: 2, name: 'Χώροι', icon: '🏠' },
  { step: 3, name: 'Δραστηριότητες', icon: '⚽' },
  { step: 4, name: 'Προσωπικό', icon: '👥' },
  { step: 5, name: 'Ομάδες', icon: '👨‍👩‍👧‍👦' },
  { step: 6, name: 'Πρότυπο', icon: '📄' },
  { step: 7, name: 'Κανόνες', icon: '⚡' },
  { step: 8, name: 'Πρόγραμμα', icon: '📊' },
];

export default function GuidePage() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1]);

  const toggleStep = (stepId: number) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="text-5xl mb-4 block">🏕️</span>
        <h1 className="text-3xl font-bold text-gray-900">
          Οδηγός Ρύθμισης CampWise
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Ακολούθησε τα βήματα για να στήσεις το πρόγραμμα της κατασκήνωσής σου
        </p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm">
          <span>⏱️</span>
          <span>Συνολικός χρόνος: ~60-90 λεπτά για πλήρη ρύθμιση</span>
        </div>
      </div>

      {/* Visual Workflow */}
      <Card className="mb-8 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <CardTitle className="text-lg">Επισκόπηση Διαδικασίας</CardTitle>
          <CardDescription className="text-primary-100">
            Τα 8 βήματα για να έχεις έτοιμο πρόγραμμα
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-wrap justify-center gap-2 md:gap-0">
            {WORKFLOW_DIAGRAM.map((item, idx) => (
              <div key={item.step} className="flex items-center">
                <button
                  onClick={() => {
                    setActiveStep(item.step);
                    setExpandedSteps([item.step]);
                    document.getElementById(`step-${item.step}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={cn(
                    'flex flex-col items-center p-3 rounded-lg transition-all hover:scale-105',
                    activeStep === item.step
                      ? 'bg-primary-100 ring-2 ring-primary-500'
                      : 'hover:bg-gray-100'
                  )}
                >
                  <span className="text-2xl mb-1">{item.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{item.name}</span>
                </button>
                {idx < WORKFLOW_DIAGRAM.length - 1 && (
                  <span className="hidden md:block text-gray-300 mx-1">→</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/dashboard/sessions/new" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-200">
            <CardContent className="p-4 text-center">
              <span className="text-3xl block mb-2">🚀</span>
              <span className="font-medium text-gray-900">Ξεκίνα Τώρα</span>
              <p className="text-xs text-gray-500 mt-1">Δημιουργία Περιόδου</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-200">
            <CardContent className="p-4 text-center">
              <span className="text-3xl block mb-2">📊</span>
              <span className="font-medium text-gray-900">Dashboard</span>
              <p className="text-xs text-gray-500 mt-1">Δες την πρόοδο</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/schedule" className="block">
          <Card className="h-full hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-200">
            <CardContent className="p-4 text-center">
              <span className="text-3xl block mb-2">📅</span>
              <span className="font-medium text-gray-900">Πρόγραμμα</span>
              <p className="text-xs text-gray-500 mt-1">Δες το πλέγμα</p>
            </CardContent>
          </Card>
        </Link>
        <button
          onClick={() => setExpandedSteps(SETUP_STEPS.map(s => s.id))}
          className="block w-full"
        >
          <Card className="h-full hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary-200">
            <CardContent className="p-4 text-center">
              <span className="text-3xl block mb-2">📖</span>
              <span className="font-medium text-gray-900">Άνοιξε Όλα</span>
              <p className="text-xs text-gray-500 mt-1">Δες όλα τα βήματα</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {SETUP_STEPS.map((step) => (
          <Card
            key={step.id}
            id={`step-${step.id}`}
            className={cn(
              'overflow-hidden transition-all',
              activeStep === step.id && 'ring-2 ring-primary-500'
            )}
          >
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full text-left"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-2xl">
                      {step.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-primary-600">Βήμα {step.id}:</span>
                        {step.title}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 hidden sm:block">
                      ⏱️ {step.duration}
                    </span>
                    <span className={cn(
                      'text-2xl transition-transform',
                      expandedSteps.includes(step.id) ? 'rotate-180' : ''
                    )}>
                      ▼
                    </span>
                  </div>
                </div>
              </CardHeader>
            </button>

            {expandedSteps.includes(step.id) && (
              <CardContent className="pt-0 pb-6">
                <div className="border-t pt-4 space-y-4">
                  {/* Details */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <span>📝</span> Τι πρέπει να ξέρεις
                    </h4>
                    <ul className="space-y-2">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-primary-500 mt-0.5">•</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Example */}
                  {step.example && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <span>💡</span> {step.example.title}
                      </h4>
                      <ul className="space-y-1">
                        {step.example.items.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-700 font-mono bg-white px-2 py-1 rounded">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {step.tips && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                        <span>💡</span> Συμβουλές
                      </h4>
                      <ul className="space-y-1">
                        {step.tips.map((tip, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                            <span className="text-blue-500">✓</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-gray-500">
                      ⏱️ Χρόνος: {step.duration}
                    </span>
                    <Link href={step.href}>
                      <Button>
                        {step.id === 8 ? 'Πήγαινε στο Πρόγραμμα' : `Δημιουργία ${step.title.split(' ').pop()}`}
                        <span className="ml-2">→</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Final CTA */}
      <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6 text-center">
          <span className="text-4xl block mb-3">🎉</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Έτοιμος να ξεκινήσεις;
          </h3>
          <p className="text-gray-600 mb-4">
            Ακολούθησε τα βήματα με τη σειρά και σε λιγότερο από 2 ώρες θα έχεις
            έτοιμο το πρόγραμμα της κατασκήνωσής σου!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard/sessions/new">
              <Button size="lg" className="w-full sm:w-auto">
                <span className="mr-2">🚀</span>
                Ξεκίνα με το Βήμα 1
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                <span className="mr-2">📊</span>
                Πήγαινε στο Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Συχνές Ερωτήσεις
        </h2>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">❓ Μπορώ να αλλάξω κάτι αργότερα;</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">
                Ναι! Όλα τα δεδομένα μπορούν να επεξεργαστούν ανά πάσα στιγμή.
                Αν αλλάξεις κάτι, το πρόγραμμα θα ενημερωθεί αυτόματα.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">❓ Τι γίνεται αν κάνω λάθος;</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">
                Μην ανησυχείς! Τίποτα δεν διαγράφεται οριστικά. Μπορείς να
                επεξεργαστείς ή να απενεργοποιήσεις οτιδήποτε.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">❓ Πρέπει να κάνω όλα τα βήματα;</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">
                Τα βήματα 1-6 είναι απαραίτητα. Το βήμα 7 (Περιορισμοί) είναι
                προαιρετικό αλλά συνιστάται για καλύτερο πρόγραμμα.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">❓ Πώς δημιουργείται αυτόματα το πρόγραμμα;</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600">
                Το σύστημα χρησιμοποιεί AI και αλγόριθμους για να δημιουργήσει
                πρόγραμμα που σέβεται τους περιορισμούς, κατανέμει δίκαια τις
                δραστηριότητες και αποφεύγει συγκρούσεις.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
