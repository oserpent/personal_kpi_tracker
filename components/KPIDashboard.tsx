import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Collapsible from "react-native-collapsible";
import { Button, Text, TextInput } from "react-native-paper";
import KPIForm from "./KPIForm";

export type quantifier = "minutes" | "hours" | "quantity" | null;

export type kpiType = {
  name: string;
  quantity: number;
  quantifier: quantifier;
};

export interface kpiDBType extends kpiType {
  id: number;
  //   to finish kpi_completion type later
  kpi_completion: any;
}

export interface processedKPIType extends kpiType {
  id: number;
  quantityCompleted: number;
  kpiCompletedId: string | null;
}

export const utcMidnight = () => {
  const dateToday = new Date().toLocaleDateString();
  const [month, day, year] = dateToday.split("/").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export default function KPIDashboard() {
  const { user } = useAuth()!;
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [kpis, setKPIs] = useState<kpiDBType[]>([]);
  const [error, setError] = useState<string>("");
  const [date, setDate] = useState(utcMidnight);
  useEffect(() => {
    fetchKPIs();

    const channel1 = supabase
      .channel("kpi-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kpi",
        },
        (payload) => {
          fetchKPIs();
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel("kpi-completions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "kpi_completion",
        },
        (payload) => {
          fetchKPIs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel1);
      supabase.removeChannel(channel2);
    };
  }, [date, user]);

  const fetchKPIs = async () => {
    if (!user) {
      return;
    }
    /*
        select
        kpi.id,
        kpi.name,
        kpi.quantity,
        kpi_completion.id,
        kpi_completion.quantity_completed,
        kpi.quantifier
        from
        kpi
        left join kpi_completion on kpi.id = kpi_completion.kpi_id
        where
        kpi.user_id = {user.id}
        and kpi_completion.completed_at = {date.toISOString().split("T")[0]}
    */
    const { data, error } = await supabase
      .from("kpi")
      .select(
        `
        id,
        name,
        quantity,
        quantifier,
        kpi_completion(
          id,
          quantity_completed
        )
        `
      )
      .eq("user_id", user.id)
      .eq("kpi_completion.completed_at", date.toISOString().split("T")[0]);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setKPIs(data);
    }
  };

  const KPICard = ({
    id: kpi_id,
    name,
    quantity,
    quantifier,
    quantityCompleted,
    kpiCompletedId,
  }: processedKPIType) => {
    const [quantityCompletedDraft, setQuantityCompletedDraft] =
      useState<string>(quantityCompleted.toString());

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

    return (
      <View style={styles.kpiCard}>
        <Button onPress={decrement}>-</Button>
        <View>
          <Text>{name}</Text>
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
            />
            /{quantity} {quantifier}
          </Text>
        </View>
        <Button onPress={increment}>+</Button>
      </View>
    );
  };

  const processedKPIs: processedKPIType[] = kpis.map((item) => {
    const { kpi_completion, ...kpi } = item;
    let quantityCompleted = 0;
    let kpiCompletedId = null;
    if (kpi_completion.length !== 0) {
      quantityCompleted = kpi_completion[0].quantity_completed;
      kpiCompletedId = kpi_completion[0].id;
    }
    return { ...kpi, quantityCompleted, kpiCompletedId };
  });

  const getKPIIndex = (kpis: processedKPIType[]) => {
    let sum = 0;
    for (let kpi of kpis) {
      const partialKPIIndex = kpi.quantityCompleted / kpi.quantity;
      sum += partialKPIIndex < 1 ? partialKPIIndex : 1;
    }
    return sum / kpis.length;
  };

  return (
    <View>
      <Text>KPI Index: {getKPIIndex(processedKPIs).toFixed(2)}</Text>
      <FlatList
        data={processedKPIs}
        renderItem={({ item }) => {
          return <KPICard {...item} />;
        }}
        keyExtractor={(item) => item.id.toString()}
      />
      <DateTimePicker
        value={date}
        onChange={(_, newDate) => {
          if (newDate) {
            setDate(newDate);
          }
        }}
        timeZoneName={"UTC"}
      />
      <Button onPress={() => setCollapsed((prevCollapsed) => !prevCollapsed)}>
        Add KPI
      </Button>
      {error && <Text>{error}</Text>}
      <Collapsible collapsed={collapsed}>
        <KPIForm />
      </Collapsible>
    </View>
  );
}

const styles = StyleSheet.create({
  kpiCard: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
