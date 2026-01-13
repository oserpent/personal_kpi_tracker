import { useAuth } from "@/util/auth";
import { useState } from "react";
import { KeyboardAvoidingView, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import RNPickerSelect from "react-native-picker-select";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  type quantifier = "minutes" | "hours" | "quantity" | null;

  const { user, loading, signOut } = useAuth()!;

  const [kpiName, setKPIName] = useState<string>("");
  const [kpiQuantity, setKPIQuantity] = useState<number>(0);
  const [kpiQuantifier, setKPIQuantifier] = useState<quantifier>(null);
  const [error, setError] = useState<string>("");

  const createKPI = async (kpiName, kpiQuantity, kpiQuantifier) => {
    if (kpiName === "" || kpiQuantity === 0 || kpiQuantifier === null) {
      setError("A required field is empty");
      return;
    }
    //createKPI
    setKPIName("");
    setKPIQuantity(0);
    setKPIQuantifier(null);
  };

  return loading || !user ? (
    <SafeAreaView>
      <View>
        <Text>Personal KPI Tracker</Text>
      </View>
    </SafeAreaView>
  ) : (
    <SafeAreaView>
      <View>
        <Button onPress={signOut}>Sign Out</Button>
        <KeyboardAvoidingView>
          <Text variant="displaySmall">New KPI</Text>
          <TextInput
            label="KPI Name"
            autoCapitalize="none"
            mode="outlined"
            onChangeText={(newKPIName) => setKPIName(newKPIName)}
          />
          <TextInput
            label="Quantity"
            autoCapitalize="none"
            mode="outlined"
            secureTextEntry
            onChangeText={(newKPIQuantity) =>
              setKPIQuantity(Number(newKPIQuantity))
            }
          />
          <RNPickerSelect
            onValueChange={(newKPIQuantifier) => {
              setKPIQuantifier(newKPIQuantifier);
            }}
            items={[
              { label: "Minutes", value: "minutes" },
              { label: "Hours", value: "hours" },
              { label: "Times", value: "times" },
            ]}
            style={{ inputIOSContainer: { pointerEvents: "none" } }}
          />
          <Button
            onPress={() => createKPI(kpiName, kpiQuantity, kpiQuantifier)}
          >
            Create
          </Button>
          <Text>{error}</Text>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}
