// path: src/providers/AuthProvider.tsx
import { useMe } from "@/features/auth/auth.queries";
import AuthLoading from "@/components/common/AuthLoading";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoading } = useMe();

  if (isLoading) return <AuthLoading />;
  return <>{children}</>;
}
