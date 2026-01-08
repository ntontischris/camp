import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-600">CampWise</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-primary-600"
              >
                Είσοδος
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
              >
                Εγγραφή
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Διαχείριση Κατασκήνωσης</span>
            <span className="block text-primary-600">Απλά & Έξυπνα</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Δημιούργησε αυτόματα το πρόγραμμα της κατασκήνωσής σου με έξυπνους αλγόριθμους.
            Διαχειρίσου ομάδες, δραστηριότητες, προσωπικό και χώρους σε μία πλατφόρμα.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="rounded-lg bg-primary-600 px-8 py-3 text-base font-medium text-white shadow-lg hover:bg-primary-700"
            >
              Ξεκίνα Δωρεάν
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg border border-gray-300 bg-white px-8 py-3 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Έχω Λογαριασμό
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📅"
            title="Αυτόματη Δημιουργία Προγράμματος"
            description="Δημιούργησε πρόγραμμα με ένα κλικ. Ο αλγόριθμος σέβεται όλους τους περιορισμούς."
          />
          <FeatureCard
            icon="👥"
            title="Διαχείριση Ομάδων"
            description="Οργάνωσε τους κατασκηνωτές σε ομάδες με ηλικιακά κριτήρια και χωρητικότητα."
          />
          <FeatureCard
            icon="🎯"
            title="Βιβλιοθήκη Δραστηριοτήτων"
            description="Δημιούργησε και επαναχρησιμοποίησε δραστηριότητες με όλες τις λεπτομέρειες."
          />
          <FeatureCard
            icon="🏕️"
            title="Διαχείριση Χώρων"
            description="Κράτα τους χώρους οργανωμένους. Αποφυγή συγκρούσεων αυτόματα."
          />
          <FeatureCard
            icon="⚙️"
            title="Έξυπνοι Περιορισμοί"
            description="10 τύποι περιορισμών για τέλειο πρόγραμμα. Χρονικοί, ακολουθίας, καιρού κ.α."
          />
          <FeatureCard
            icon="📄"
            title="Εξαγωγή PDF"
            description="Εκτύπωσε το πρόγραμμα ανά ομάδα, ανά ημέρα ή συνολικά."
          />
        </div>

        {/* CTA Section */}
        <div className="mt-24 rounded-2xl bg-primary-600 px-8 py-12 text-center text-white">
          <h2 className="text-3xl font-bold">Έτοιμος να ξεκινήσεις;</h2>
          <p className="mt-4 text-lg text-primary-100">
            Δημιούργησε τον λογαριασμό σου δωρεάν και ξεκίνα να οργανώνεις την κατασκήνωσή σου.
          </p>
          <Link
            href="/auth/signup"
            className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-base font-medium text-primary-600 shadow-lg hover:bg-gray-100"
          >
            Δημιουργία Λογαριασμού
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500">
          <p>&copy; 2024 CampWise. Όλα τα δικαιώματα κατοχυρωμένα.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
