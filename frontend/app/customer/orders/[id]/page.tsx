export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main>
      <h1 className="text-xl font-semibold text-slate-900">Order Details</h1>
      <p className="mt-2 text-sm text-slate-600">Order ID: {params.id}</p>
    </main>
  );
}
