import MainLayout from "@/components/layout/MainLayout";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout portal="customer">{children}</MainLayout>;
}
