import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ArrowLeft,
  RefreshCw,
  Server,
  Thermometer,
} from "lucide-react-native";

import {
  getTelemetry,
  Telemetry,
} from "../services/api";

const ACTIVE_RACKS = [1, 6, 12, 18];

function getStatus(temp: number) {
  if (temp >= 27) {
    return {
      label: "CRÍTICO",
      color: "#EF4444",
    };
  }

  if (temp >= 25.5) {
    return {
      label: "ADVERTENCIA",
      color: "#F59E0B",
    };
  }

  return {
    label: "NORMAL",
    color: "#10B981",
  };
}

function getLatestRacks(
  telemetry: Telemetry[]
): Telemetry[] {
  const latest = new Map<number, Telemetry>();

  telemetry
    .filter((item) =>
      ACTIVE_RACKS.includes(Number(item.rack))
    )
    .forEach((item) => {
      const rack = Number(item.rack);
      const current = latest.get(rack);

      if (
        !current ||
        new Date(item.recorded_at).getTime() >
          new Date(current.recorded_at).getTime()
      ) {
        latest.set(rack, item);
      }
    });

  return ACTIVE_RACKS
    .map((rack) => latest.get(rack))
    .filter(
      (item): item is Telemetry =>
        item !== undefined
    );
}

export default function RacksScreen() {
  const [racks, setRacks] = useState<Telemetry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadRacks = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const telemetry = await getTelemetry();

        const latestRacks =
          getLatestRacks(telemetry);

        setRacks(latestRacks);
      } catch (err: any) {
        console.error(
          "Error cargando racks:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "No se pudo obtener la telemetría."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadRacks();

    const interval = setInterval(() => {
      loadRacks();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadRacks]);

  const normalCount = racks.filter(
    (rack) => rack.temperature < 25.5
  ).length;

  const warningCount = racks.filter(
    (rack) =>
      rack.temperature >= 25.5 &&
      rack.temperature < 27
  ).length;

  const criticalCount = racks.filter(
    (rack) => rack.temperature >= 27
  ).length;

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
            <ArrowLeft
              size={21}
              color="#F8FAFC"
            />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              Racks
            </Text>

            <Text style={styles.subtitle}>
              {racks.length} racks monitoreados
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadRacks(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator
                size="small"
                color="#10B981"
              />
            ) : (
              <RefreshCw
                size={20}
                color="#10B981"
              />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {racks.length}
            </Text>

            <Text style={styles.summaryLabel}>
              TOTAL
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryNumber,
                { color: "#10B981" },
              ]}
            >
              {normalCount}
            </Text>

            <Text style={styles.summaryLabel}>
              NORMALES
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryNumber,
                { color: "#F59E0B" },
              ]}
            >
              {warningCount}
            </Text>

            <Text style={styles.summaryLabel}>
              ALERTA
            </Text>
          </View>

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.summaryNumber,
                { color: "#EF4444" },
              ]}
            >
              {criticalCount}
            </Text>

            <Text style={styles.summaryLabel}>
              CRÍTICOS
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerMessage}>
            <ActivityIndicator
              size="large"
              color="#10B981"
            />

            <Text style={styles.messageText}>
              Cargando telemetría...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>
              Error de conexión
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadRacks(true)}
            >
              <Text style={styles.retryText}>
                REINTENTAR
              </Text>
            </TouchableOpacity>
          </View>
        ) : racks.length === 0 ? (
          <View style={styles.centerMessage}>
            <Server
              size={40}
              color="#64748B"
            />

            <Text style={styles.messageText}>
              No hay telemetría disponible.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {racks.map((rack) => {
              const status = getStatus(
                Number(rack.temperature)
              );

              return (
                <TouchableOpacity
                  key={rack.rack}
                  style={styles.card}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: "/rack/id",
                      params: {
                        id: String(rack.rack),
                      },
                    })
                  }
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.rackName}>
                      RACK{" "}
                      {String(rack.rack).padStart(
                        2,
                        "0"
                      )}
                    </Text>

                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor:
                            status.color,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.temperatureRow}>
                    <Thermometer
                      size={22}
                      color={status.color}
                    />

                    <Text style={styles.temperature}>
                      {Number(
                        rack.temperature
                      ).toFixed(1)}
                      °
                    </Text>

                    <Text style={styles.celsius}>
                      C
                    </Text>
                  </View>

                  <View style={styles.statusRow}>
                    <Text
                      style={[
                        styles.status,
                        {
                          color:
                            status.color,
                        },
                      ]}
                    >
                      {status.label}
                    </Text>

                    <Text style={styles.cpu}>
                      CPU{" "}
                      {Number(
                        rack.cpu_load
                      ).toFixed(0)}
                      %
                    </Text>
                  </View>

                  <View style={styles.details}>
                    <View>
                      <Text style={styles.detailLabel}>
                        HUMEDAD
                      </Text>

                      <Text
                        style={
                          styles.detailValue
                        }
                      >
                        {Number(
                          rack.humidity
                        ).toFixed(1)}
                        %
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.detailLabel}>
                        AIRFLOW
                      </Text>

                      <Text
                        style={
                          styles.detailValue
                        }
                      >
                        {Number(
                          rack.airflow
                        ).toFixed(1)}
                        %
                      </Text>
                    </View>

                    <View>
                      <Text style={styles.detailLabel}>
                        POTENCIA
                      </Text>

                      <Text
                        style={
                          styles.detailValue
                        }
                      >
                        {Number(
                          rack.power_kw
                        ).toFixed(1)}
                        kW
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

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

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
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
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 17,
  },

  summaryItem: {
    alignItems: "center",
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
    backgroundColor: "#131B2E",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#243049",
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

  details: {
    marginTop: 15,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: "#243049",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  detailLabel: {
    color: "#64748B",
    fontSize: 7,
    fontWeight: "800",
  },

  detailValue: {
    color: "#CBD5E1",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 3,
  },

  centerMessage: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
  },

  messageText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 14,
  },

  errorBox: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#7F1D1D",
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
  },

  errorTitle: {
    color: "#FCA5A5",
    fontSize: 16,
    fontWeight: "700",
  },

  errorText: {
    color: "#94A3B8",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },

  retryButton: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});