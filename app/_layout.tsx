import { AuthProvider, useAuth } from "@/util/auth";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

function AuthGuard({ children }: any) {
  const router = useRouter();
  const { user, loading } = useAuth()!;

  useEffect(() => {
    if (!user && !loading) {
      router.replace("/login");
    } else if (user && !loading) {
      router.replace("/");
    }
  }, [user, loading]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
}
