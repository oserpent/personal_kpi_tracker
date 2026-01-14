import { useAuth } from "@/util/auth";
import { supabase } from "@/util/supabase-client";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Button, Text } from "react-native-paper";
import { utcMidnight } from "./KPIDashboard";

export default function KPIOverview() {
  function getSunday(d: Date) {
    let day = d.getDay(),
      diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  function getLocalDateString(d: Date) {
    return `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  }

  const getStartOfWeek = () => {
    return getSunday(utcMidnight());
  };

  const { user } = useAuth()!;
  const [startOfWeek, setStartOfWeek] = useState<Date>(getStartOfWeek);
  const [weeklyKPIIndices, setWeeklyKPIIndices] = useState<any>({
    labels: [],
    datasets: [
      {
        data: [],
      },
    ],
  });
  const [error, setError] = useState<string>("");

  const fetchWeeklyKPIs = async (startOfWeek: Date) => {
    const weekDateStrings = [0, 1, 2, 3, 4, 5, 6].map((offset) => {
      let day = new Date(startOfWeek.getTime());
      day.setDate(day.getDate() + offset);
      return getLocalDateString(day);
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
            `
        )
        .eq("user_id", user.id)
        .in("kpi_completion.completed_at", weekDateStrings);
      if (error) {
        setError(error.message);
      }
      if (kpis) {
        const kpiWeekDateData = [];
        for (let day of weekDateStrings) {
          let sum = 0;
          for (let kpi of kpis) {
            const dayKPICompletion = kpi.kpi_completion.find(
              (kc) => kc.completed_at === day
            );
            if (dayKPICompletion) {
              const partialKPIIndex =
                dayKPICompletion.quantity_completed / kpi.quantity;
              sum += partialKPIIndex < 1 ? partialKPIIndex : 1;
            }
            // no else because don't add if kpi_completion row does not exist
          }
          kpiWeekDateData.push(sum / kpis.length);
        }
        setWeeklyKPIIndices({
          labels: weekDateStrings,
          datasets: [
            {
              data: kpiWeekDateData,
            },
          ],
        });
      }
    }
  };

  useEffect(() => {
    fetchWeeklyKPIs(startOfWeek);
  }, [startOfWeek]);

  return (
    <View style={styles.outerView}>
      <Button
        onPress={() =>
          setStartOfWeek((prevStartOfWeek) => {
            let day = new Date(prevStartOfWeek.getTime());
            day.setDate(day.getDate() - 7);
            return day;
          })
        }
      >
        Previous
      </Button>
      <View>
        <Text>
          Week KPI Index:{" "}
          {(
            weeklyKPIIndices.datasets[0].data.reduce((a, b) => a + b, 0) /
            weeklyKPIIndices.datasets[0].data.length
          ).toFixed(2)}
        </Text>
        <BarChart
          data={weeklyKPIIndices}
          width={270}
          height={220}
          yAxisLabel="KPI Index: "
          yAxisSuffix=""
          chartConfig={{
            backgroundColor: "#e26a00",
            backgroundGradientFrom: "#fb8c00",
            backgroundGradientTo: "#ffa726",
            decimalPlaces: 2, // optional, defaults to 2dp
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726",
            },
          }}
          verticalLabelRotation={30}
        />
      </View>
      <Button
        onPress={() =>
          setStartOfWeek((prevStartOfWeek) => {
            let day = new Date(prevStartOfWeek.getTime());
            day.setDate(day.getDate() + 7);
            return day;
          })
        }
      >
        Next
      </Button>
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
    flexDirection: "row",
  },
});
