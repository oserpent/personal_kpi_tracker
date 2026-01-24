import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

export default function KPICard({
  id: kpi_id,
  name,
  quantity,
  quantifier,
  quantityCompleted,
  kpiCompletedId,
  date,
  setError,
}: any) {
  const [quantityCompletedDraft, setQuantityCompletedDraft] = useState<string>(
    quantityCompleted.toString(),
  );

  const { user } = useAuth()!;

  useEffect(() => {
    setQuantityCompletedDraft(quantityCompleted.toString());
  }, [quantityCompleted]);

  const changeQuantityCompleted = async (newQuantityCompleted: number) => {
    let error;
    if (newQuantityCompleted < quantityCompleted) {
      if (kpiCompletedId) {
        if (newQuantityCompleted <= 0) {
          // if new quantity drops to zero, delete it instead of updating it
          await supabase
            .from("kpi_completion")
            .delete()
            .eq("id", kpiCompletedId);
        } else {
          // update if there exists a kpi_completion row already
          ({ error } = await supabase
            .from("kpi_completion")
            .update({ quantity_completed: newQuantityCompleted })
            .eq("id", kpiCompletedId));
        }
      }
    } else {
      if (newQuantityCompleted > quantityCompleted) {
        if (!kpiCompletedId) {
          // create if there does not exist a kpi_completion_row
          ({ error } = await supabase.from("kpi_completion").insert({
            user_id: user?.id,
            kpi_id: kpi_id,
            completed_at: date,
            quantity_completed: newQuantityCompleted,
          }));
        } else {
          // update if there exists a kpi_completion row already
          ({ error } = await supabase
            .from("kpi_completion")
            .update({ quantity_completed: newQuantityCompleted })
            .eq("id", kpiCompletedId));
        }
      }
    }
    if (error) {
      setError(error.message);
    }
  };

  const decrement = () => {
    const newQuantityCompleted = Number.isInteger(quantityCompleted)
      ? quantityCompleted - 1
      : Math.floor(quantityCompleted);
    changeQuantityCompleted(newQuantityCompleted);
  };

  const increment = () => {
    const newQuantityCompleted = Number.isInteger(quantityCompleted)
      ? quantityCompleted + 1
      : Math.ceil(quantityCompleted);
    changeQuantityCompleted(newQuantityCompleted);
  };

  const styles = StyleSheet.create({
    kpiCard: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    kpiAllQuantity: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
    },
    kpiQuantityControls: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 4,
    },
    quantityTextInput: {
      width: 50,
      height: 40,
      textAlign: "center",
    },
    decrementButton: {
      minWidth: 40,
      backgroundColor: "#FFB0A3",
    },
    incrementButton: {
      minWidth: 40,
      backgroundColor: "#A3FFAB",
    },
    quantity: {
      fontSize: 20,
      width: 30,
    },
    divider: {
      fontSize: 30,
    },
    quantifier: {
      width: 50,
    },
  });

  return (
    <View style={styles.kpiCard}>
      <Text>{name}</Text>
      <View style={styles.kpiAllQuantity}>
        <View style={styles.kpiQuantityControls}>
          <Button onPress={decrement} style={styles.decrementButton}>
            -
          </Button>
          <Text>
            <TextInput
              value={quantityCompletedDraft}
              onSubmitEditing={({
                nativeEvent: { text: newQuantityCompletedString },
              }) => {
                changeQuantityCompleted(Number(newQuantityCompletedString));
              }}
              onChangeText={(newQuantityCompletedDraft) =>
                setQuantityCompletedDraft(newQuantityCompletedDraft)
              }
              onBlur={() => {
                setQuantityCompletedDraft(quantityCompleted.toString());
              }}
              style={styles.quantityTextInput}
            />
          </Text>
          <Button onPress={increment} style={styles.incrementButton}>
            +
          </Button>
          <Text style={styles.divider}>/</Text>
          <Text style={styles.quantity}> {quantity}</Text>
        </View>
        <Text style={styles.quantifier}>
          {quantifier !== "minutes" ? quantifier : "min"}
        </Text>
      </View>
    </View>
  );
}
