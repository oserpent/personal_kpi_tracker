import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import { useState } from "react";
import { KeyboardAvoidingView, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import RNPickerSelect from "react-native-picker-select";

export default function KPIForm() {

  const { user } = useAuth()!;

  const [kpiName, setKPIName] = useState<string>("");
  const [kpiQuantity, setKPIQuantity] = useState<number>(0);
  const [kpiQuantifier, setKPIQuantifier] = useState<quantifier>(null);
  const [error, setError] = useState<string>("");

  const createKPI = async (
    kpiName: string,
    kpiQuantity: number,
    kpiQuantifier: quantifier
  ) => {
    if (kpiName === "" || kpiQuantity === 0 || kpiQuantifier === null) {
      setError("A required field is empty");
      return;
    }
    const { error } = await supabase.from("kpi").insert({
      user_id: user?.id,
      name: kpiName,
      quantity: kpiQuantity,
      quantifier: kpiQuantifier,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setKPIName("");
    setKPIQuantity(0);
    setKPIQuantifier(null);
    setError("");
  };

  return (
    <View>
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
        <Button onPress={() => createKPI(kpiName, kpiQuantity, kpiQuantifier)}>
          Create
        </Button>
        <Text>{error}</Text>
      </KeyboardAvoidingView>
    </View>
  );
}
