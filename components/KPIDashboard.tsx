import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Collapsible from "react-native-collapsible";
import { Button, Text } from "react-native-paper";
import KPIForm from "./kpiForm";

export type quantifier = "minutes" | "hours" | "quantity" | null;

export type kpiType = {
  name: string;
  quantity: number;
  quantifier: quantifier;
};

interface kpiDBType extends kpiType {
  id: number;
  //   to finish kpi_completion type later
  kpi_completion: any;
}

interface kpiCardPropsType extends kpiType {
  id: number;
  quantityCompleted: number;
  kpiCompletedId: string | null;
}

export default function KPIDashboard() {
  const { user } = useAuth()!;
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [kpis, setKPIs] = useState<kpiDBType[]>([]);
  const [error, setError] = useState<string>("");
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now;
  });
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
  }, []);

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
        kpi.user_id = 5
        and kpi_completion.datetime = 5
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
      .eq("user_id", user.id);
    //   .eq("kpi_completion.datetime", 5);
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
  }: kpiCardPropsType) => {
    const decrement = async () => {
      if (kpiCompletedId) {
        const newQuantityCompleted = Number.isInteger(quantityCompleted)
          ? quantityCompleted - 1
          : Math.floor(quantityCompleted);
        if (newQuantityCompleted === 0) {
          // if new quantity drops to zero, delete it instead of updating it
          await supabase
            .from("kpi_completion")
            .delete()
            .eq("id", kpiCompletedId);
        } else {
          // update if there exists a kpi_completion row already
          const { error } = await supabase
            .from("kpi_completion")
            .update({ quantity_completed: newQuantityCompleted })
            .eq("id", kpiCompletedId);
          if (error) {
            setError(error.message);
          }
        }
      }
    };

    const increment = async () => {
      let error;
      const newQuantityCompleted = Number.isInteger(quantityCompleted)
        ? quantityCompleted + 1
        : Math.ceil(quantityCompleted);
      if (!kpiCompletedId) {
        // create if there does not exist a kpi_completion_row
        ({ error } = await supabase.from("kpi_completion").insert({
          user_id: user?.id,
          kpi_id: kpi_id,
          completed_at: new Date(),
          quantity_completed: newQuantityCompleted,
        }));
      } else {
        // update if there exists a kpi_completion row already
        ({ error } = await supabase
          .from("kpi_completion")
          .update({ quantity_completed: newQuantityCompleted })
          .eq("id", kpiCompletedId));
      }
      if (error) {
        setError(error.message);
      }
    };

    return (
      <View style={styles.kpiCard}>
        <Button onPress={decrement}>-</Button>
        <View>
          <Text>{name}</Text>
          <Text>
            {quantityCompleted}/{quantity} {quantifier}
          </Text>
        </View>
        <Button onPress={increment}>+</Button>
      </View>
    );
  };

  return (
    <View>
      <FlatList
        data={kpis}
        renderItem={({ item }) => {
          const { kpi_completion, ...kpi } = item;
          let quantityCompleted = 0;
          let kpiCompletedId = null;
          if (kpi_completion.length !== 0) {
            quantityCompleted = kpi_completion[0].quantity_completed;
            kpiCompletedId = kpi_completion[0].id;
          }
          const kpiCardProps = { ...kpi, quantityCompleted, kpiCompletedId };
          return <KPICard {...kpiCardProps} />;
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
