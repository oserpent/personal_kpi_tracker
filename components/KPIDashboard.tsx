import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Collapsible from "react-native-collapsible";
import { Button, Text, useTheme } from "react-native-paper";
import KPICard from "./KPICard";
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
  const { colors } = useTheme();
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
        },
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
        },
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
        `,
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

  const styles = StyleSheet.create({
    dashboardBox: {
      alignItems: "center",
    },
    kpiIndexBox: {
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderRadius: 50,
    },
    kpiCard: {
      flexDirection: "row",
      justifyContent: "center",
    },
    kpiText: {
      fontSize: 25,
    },
    kpiBad: {
      backgroundColor: "#ff6b61",
    },
    kpiOk: {
      backgroundColor: "#fdd140",
    },
    kpiGood: {
      backgroundColor: "#8dfd6b",
    },
    kpiBadText: {
      color: "#c40e01",
    },
    kpiOkText: {
      color: "#a78000",
    },
    kpiGoodText: {
      color: "#25a000",
    },
  });

  const kpiIndex = getKPIIndex(processedKPIs);
  let kpiQualityStyle = styles.kpiBad;
  let kpiQualityTextStyle = styles.kpiBadText;
  if (kpiIndex >= 0 && kpiIndex <= 0.3) {
    kpiQualityStyle = styles.kpiBad;
    kpiQualityTextStyle = styles.kpiBadText;
  } else if (kpiIndex > 0.3 && kpiIndex < 0.7) {
    kpiQualityStyle = styles.kpiOk;
    kpiQualityTextStyle = styles.kpiOkText;
  } else if (kpiIndex >= 0.7 && kpiIndex <= 1) {
    kpiQualityStyle = styles.kpiGood;
    kpiQualityTextStyle = styles.kpiGoodText;
  }

  return (
    <>
      <View style={styles.dashboardBox}>
        <View style={[styles.kpiIndexBox, kpiQualityStyle]}>
          <Text style={[styles.kpiText, kpiQualityTextStyle]}>
            {kpiIndex.toFixed(2)}
          </Text>
        </View>
        <View>
          {processedKPIs.map((item) => (
            <KPICard {...item} date={date} setError={setError} key={item.id} />
          ))}
        </View>
        {/* <FlatList
          data={processedKPIs}
          renderItem={({ item }) => {
            return <KPICard {...item} date={date} setError={setError} />;
          }}
          keyExtractor={(item) => item.id.toString()}
        /> */}
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
      </View>
      <Collapsible collapsed={collapsed}>
        <KPIForm collapseForm={() => setCollapsed(true)} />
      </Collapsible>
    </>
  );
}
