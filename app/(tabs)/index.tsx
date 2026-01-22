import KPIDashboard from "@/components/KPIDashboard";
import { useAuth } from "@/util/auth";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const { colors } = useTheme();
  const { user, loading, signOut } = useAuth()!;

  const styles = StyleSheet.create({
    container: {
      paddingTop: 0,
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    signOutButton: {
      backgroundColor: "#ffa6a6",
      width: "30%",
      marginRight: "5%",
      marginTop: "5%",
    },
    signOutLabel: {
      color: "#610000",
    },
    navHeader: {
      alignItems: "flex-end",
      marginBottom: "10%",
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {loading || !user ? (
        <View>
          <Text>Personal KPI Tracker</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          enabled={true}
          behavior="padding"
          style={{ flex: 1 }}
          keyboardVerticalOffset={100}
        >
          <ScrollView style={styles.scrollView}>
            <View style={styles.navHeader}>
              <Button
                onPress={signOut}
                style={styles.signOutButton}
                labelStyle={styles.signOutLabel}
              >
                Sign Out
              </Button>
            </View>
            <KPIDashboard />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
