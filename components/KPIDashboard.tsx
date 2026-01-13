import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import Collapsible from "react-native-collapsible";
import { Button, Text } from "react-native-paper";
import KPIForm from "./kpiForm";

export type quantifier = "minutes" | "hours" | "quantity" | null;

export type KPI = {
  name: string;
  quantity: number;
  quantifier: quantifier;
};

interface kpiID extends KPI {
  id: number;
}

export default function KPIDashboard() {
  const { user } = useAuth()!;
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [kpis, setKPIs] = useState<kpiID[]>([]);
  const [error, setError] = useState<string>("");
  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    if (!user) {
      return;
    }
    const { data, error } = await supabase
      .from("kpi")
      .select(
        `
        id,
        name,
        quantity,
        quantifier
        `
      )
      .eq("user_id", user.id);
    if (error) {
      setError(error.message);
      return;
    }
    if (data) {
      setKPIs(data);
    }
  };

  const KPICard = ({ name, quantity, quantifier }: KPI) => {
    return (
      <View>
        <Text>{name}</Text>
        <Text>
          {quantity} {quantifier}
        </Text>
      </View>
    );
  };

  return (
    <View>
      <FlatList
        data={kpis}
        renderItem={({ item }) => {
          const { id, ...kpi } = item;
          return <KPICard {...kpi} />;
        }}
        keyExtractor={(item) => item.id.toString()}
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
