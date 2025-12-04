export default function NotAuthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="rounded-xl border border-border bg-card px-6 py-8 text-center shadow-lg">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-2 text-sm text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    </div>
  );
}
