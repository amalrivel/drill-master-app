import { requireAuthedEmail } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireAuthedEmail();
  return <>{children}</>;
}
