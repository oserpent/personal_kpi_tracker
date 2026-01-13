import { AuthProvider, useAuth } from "@/util/auth";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

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
      <PaperProvider>
        <SafeAreaProvider>
          <AuthGuard>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
          </AuthGuard>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
}
