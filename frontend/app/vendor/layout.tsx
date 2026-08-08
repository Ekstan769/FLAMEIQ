import MainLayout from "@/components/layout/MainLayout";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout portal="vendor">{children}</MainLayout>;
}
