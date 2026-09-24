import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ArrowLeft, Server, Thermometer } from "lucide-react-native";

const racks = Array.from({ length: 24 }, (_, index) => {
  const id = index + 1;

  const special: Record<number, number> = {
    6: 25.8,
    12: 27.9,
    18: 26.3,
  };

  return {
    id,
    temperature: special[id] ?? Number((23.5 + (id % 7) * 0.25).toFixed(1)),
    cpu: id === 12 ? 78 : id === 6 ? 61 : id === 18 ? 67 : 40 + (id % 20),
    airflow: id === 12 ? 55 : id === 6 ? 55 : id === 18 ? 58 : 68 + (id % 8),
    power: id === 12 ? 245 : 205 + (id % 15) * 2,
  };
});

function getStatus(temp: number) {
  if (temp >= 27) {
    return { label: "CRÍTICO", color: "#EF4444" };
  }

  if (temp >= 25.5) {
    return { label: "ADVERTENCIA", color: "#F59E0B" };
  }

  return { label: "NORMAL", color: "#22C55E" };
}

export default function RacksScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.back}
            onPress={() => router.back()}
          >
            <ArrowLeft size={21} color="#F8FAFC" />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Racks</Text>
            <Text style={styles.subtitle}>
              24 racks monitoreados
            </Text>
          </View>

          <Server size={24} color="#22C55E" />
        </View>

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryNumber}>24</Text>
            <Text style={styles.summaryLabel}>TOTAL</Text>
          </View>

          <View>
            <Text style={[styles.summaryNumber, { color: "#22C55E" }]}>
              {racks.filter((r) => r.temperature < 25.5).length}
            </Text>
            <Text style={styles.summaryLabel}>NORMALES</Text>
          </View>

          <View>
            <Text style={[styles.summaryNumber, { color: "#F59E0B" }]}>
              {racks.filter(
                (r) => r.temperature >= 25.5 && r.temperature < 27
              ).length}
            </Text>
            <Text style={styles.summaryLabel}>ALERTA</Text>
          </View>

          <View>
            <Text style={[styles.summaryNumber, { color: "#EF4444" }]}>
              {racks.filter((r) => r.temperature >= 27).length}
            </Text>
            <Text style={styles.summaryLabel}>CRÍTICOS</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {racks.map((rack) => {
            const status = getStatus(rack.temperature);

            return (
            <TouchableOpacity
                 key={rack.id}
                style={styles.card}
                activeOpacity={0.75}
                 onPress={() =>
                    router.push({
                    pathname: "/rack/id",
                    params: { id: String(rack.id) },
                    })
                }
            >
                <View style={styles.cardHeader}>
                  <Text style={styles.rackName}>
                    RACK {String(rack.id).padStart(2, "0")}
                  </Text>

                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: status.color },
                    ]}
                  />
                </View>

                <View style={styles.temperatureRow}>
                  <Thermometer
                    size={22}
                    color={status.color}
                  />

                  <Text style={styles.temperature}>
                    {rack.temperature.toFixed(1)}°
                  </Text>

                  <Text style={styles.celsius}>C</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text
                    style={[
                      styles.status,
                      { color: status.color },
                    ]}
                  >
                    {status.label}
                  </Text>

                  <Text style={styles.cpu}>
                    CPU {rack.cpu}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0F1C",
  },

  container: {
    flex: 1,
    paddingHorizontal: 17,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingTop: 12,
    paddingBottom: 20,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#131B2E",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#F8FAFC",
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
  },

  summary: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  summaryNumber: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },

  summaryLabel: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 3,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },

  card: {
    width: "48.5%",
    backgroundColor: "#111827",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#243047",
    padding: 13,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rackName: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "800",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  temperatureRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 18,
  },

  temperature: {
    color: "#F8FAFC",
    fontSize: 27,
    fontWeight: "800",
    marginLeft: 7,
  },

  celsius: {
    color: "#94A3B8",
    fontSize: 11,
    marginLeft: 2,
  },

  statusRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  status: {
    fontSize: 9,
    fontWeight: "900",
  },

  cpu: {
    color: "#64748B",
    fontSize: 9,
  },
});