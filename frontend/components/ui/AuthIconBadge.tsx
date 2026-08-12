export default function AuthIconBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 p-1 shadow-xl">
      <div className="flex h-full w-full items-center justify-center rounded-full bg-white ring-1 ring-amber-200/60">
        {children}
      </div>
    </div>
  );
}