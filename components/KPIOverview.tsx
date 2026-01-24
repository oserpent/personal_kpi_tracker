import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import Entypo from "@expo/vector-icons/Entypo";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Button, Text } from "react-native-paper";
import { utcMidnight } from "./KPIDashboard";

export default function KPIOverview() {
  function getSunday(d: Date) {
    let day = d.getUTCDay(),
      diff = d.getUTCDate() - day;
    return new Date(d.setUTCDate(diff));
  }

  function getUTCDateString(d: Date) {
    return `${d.getUTCFullYear()}-${(d.getUTCMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getUTCDate().toString().padStart(2, "0")}`;
  }

  const getStartOfWeek = () => {
    return getSunday(utcMidnight());
  };

  const { user } = useAuth()!;
  const [startOfWeek, setStartOfWeek] = useState<Date>(getStartOfWeek);
  const [weeklyKPIIndices, setWeeklyKPIIndices] = useState<any>([]);
  const [error, setError] = useState<string>("");

  const fetchWeeklyKPIs = async (startOfWeek: Date) => {
    const weekDateStrings = [
      { offset: 0, dow: "Sun" },
      { offset: 1, dow: "Mon" },
      { offset: 2, dow: "Tues" },
      { offset: 3, dow: "Wed" },
      { offset: 4, dow: "Thurs" },
      { offset: 5, dow: "Fri" },
      { offset: 6, dow: "Sat" },
    ].map(({ offset, dow }) => {
      let day = new Date(startOfWeek.getTime());
      day.setDate(day.getDate() + offset);
      return { date: getUTCDateString(day), dow };
    });
    if (user) {
      const { data: kpis, error } = await supabase
        .from("kpi")
        .select(
          `
            id,
            name,
            quantity,
            quantifier,
            kpi_completion(
              id,
              quantity_completed,
              completed_at
            )
            `,
        )
        .eq("user_id", user.id)
        .in(
          "kpi_completion.completed_at",
          weekDateStrings.map((item) => item.date),
        );
      if (error) {
        setError(error.message);
      }
      if (kpis) {
        const kpiWeekDateData = [];
        for (let { date, dow } of weekDateStrings) {
          let sum = 0;
          for (let kpi of kpis) {
            const dayKPICompletion = kpi.kpi_completion.find(
              (kc) => kc.completed_at === date,
            );
            if (dayKPICompletion) {
              const partialKPIIndex =
                dayKPICompletion.quantity_completed / kpi.quantity;
              sum += partialKPIIndex < 1 ? partialKPIIndex : 1;
            }
            // no else because don't add if kpi_completion row does not exist
          }
          kpiWeekDateData.push({ value: sum / kpis.length, label: dow });
        }
        setWeeklyKPIIndices(kpiWeekDateData);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWeeklyKPIs(startOfWeek);
    }, [startOfWeek]),
  );

  return (
    <View style={styles.outerView}>
      <Text>
        Week KPI Index:{" "}
        {(
          weeklyKPIIndices.reduce((a, b) => a + b.value, 0) /
          weeklyKPIIndices.length
        ).toFixed(2)}
      </Text>
      <View style={styles.weekNavigator}>
        <Button
          onPress={() =>
            setStartOfWeek((prevStartOfWeek) => {
              let day = new Date(prevStartOfWeek.getTime());
              day.setDate(day.getDate() - 7);
              return day;
            })
          }
        >
          <Entypo name="chevron-left" size={24} color="black" />
        </Button>
        <Text>Week of {getUTCDateString(startOfWeek)}</Text>
        <Button
          onPress={() =>
            setStartOfWeek((prevStartOfWeek) => {
              let day = new Date(prevStartOfWeek.getTime());
              day.setDate(day.getDate() + 7);
              return day;
            })
          }
        >
          <Entypo name="chevron-right" size={24} color="black" />
        </Button>
      </View>
      <BarChart data={weeklyKPIIndices} maxValue={1} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    fontSize: 1,
    width: "100%",
  },
  weekNavigator: {
    flexDirection: "row",
    alignItems: "center",
  },
});
