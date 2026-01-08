export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">CampWise</h1>
          <p className="mt-2 text-sm text-gray-600">
            Πλατφόρμα Διαχείρισης Κατασκηνώσεων
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
