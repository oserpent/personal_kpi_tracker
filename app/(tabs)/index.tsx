import KPIDashboard from "@/components/KPIDashboard";
import { useAuth } from "@/util/auth";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { user, loading, signOut } = useAuth()!;

  return (
    <SafeAreaView>
      <Button onPress={signOut}>Sign Out</Button>
      {loading || !user ? (
        <View>
          <Text>Personal KPI Tracker</Text>
        </View>
      ) : (
        <KPIDashboard />
      )}
    </SafeAreaView>
  );
}
