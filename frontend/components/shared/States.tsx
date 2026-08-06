export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="p-8 text-center text-sm text-slate-500">{label}</div>;
}

export function EmptyState({
  label = "Nothing here yet.",
}: {
  label?: string;
}) {
  return <div className="p-8 text-center text-sm text-slate-500">{label}</div>;
}

export function ErrorState({
  label = "Something went wrong.",
  onRetry,
}: {
  label?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-8 text-center text-sm text-slate-500">
      <p>{label}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-800"
        >
          Retry
        </button>
      )}
    </div>
  );
}
