export default async function LoginPage() {
  // Temporary artificial delay to keep the global loading UI visible for inspection.
  await new Promise((resolve) => setTimeout(resolve, 300000)); // 300000ms = 5 minutes

  return (
    <div className="w-full max-w-sm text-center text-sm text-muted-500">
      Login page — in progress
    </div>
  );
}