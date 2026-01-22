import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import RNPickerSelect from "react-native-picker-select";
import { quantifier } from "./KPIDashboard";

export default function KPIForm({
  collapseForm,
}: {
  collapseForm: () => void;
}) {
  const { user } = useAuth()!;

  const [kpiName, setKPIName] = useState<string>("");
  const [kpiQuantity, setKPIQuantity] = useState<number>(0);
  const [kpiQuantifier, setKPIQuantifier] = useState<quantifier>(null);
  const [error, setError] = useState<string>("");

  const styles = StyleSheet.create({
    container: {
      padding: 16,
      gap: 16,
    },
    formSection: {
      gap: 12,
    },
    input: {
      backgroundColor: "#f5f5f5",
    },
    pickerContainer: {
      borderWidth: 1,
      borderRadius: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: "#f5f5f5",
    },
    button: {
      marginTop: 8,
      paddingVertical: 8,
    },
    errorText: {
      color: "#d32f2f",
      marginTop: 8,
    },
  });

  const createKPI = async (
    kpiName: string,
    kpiQuantity: number,
    kpiQuantifier: quantifier,
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
    collapseForm();
    setError("");
  };

  return (
    <View style={styles.container}>
      <Text variant="displaySmall">New KPI</Text>
      <View style={styles.formSection}>
        <TextInput
          label="KPI Name"
          autoCapitalize="none"
          mode="outlined"
          onChangeText={(newKPIName) => setKPIName(newKPIName)}
          value={kpiName}
          style={styles.input}
        />
        <TextInput
          label="Quantity"
          autoCapitalize="none"
          mode="outlined"
          onChangeText={(newKPIQuantity) =>
            setKPIQuantity(Number(newKPIQuantity))
          }
          value={kpiQuantity.toString()}
          style={styles.input}
          keyboardType="decimal-pad"
        />
        <View style={styles.pickerContainer}>
          <RNPickerSelect
            onValueChange={(newKPIQuantifier) => {
              setKPIQuantifier(newKPIQuantifier);
            }}
            items={[
              { label: "Minutes", value: "minutes" },
              { label: "Hours", value: "hours" },
              { label: "Times", value: "times" },
            ]}
            placeholder={{ label: "Select a quantifier...", value: null }}
            style={{ inputIOSContainer: { pointerEvents: "none" } }}
          />
        </View>
      </View>
      <Button
        mode="contained"
        onPress={() => createKPI(kpiName, kpiQuantity, kpiQuantifier)}
        style={styles.button}
      >
        Create
      </Button>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}
