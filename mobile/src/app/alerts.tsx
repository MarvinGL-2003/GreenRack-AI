import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Thermometer,
  XCircle,
} from "lucide-react-native";

import {
  getTelemetry,
  Telemetry,
} from "../services/api";

const ACTIVE_RACKS = [1, 6, 12, 18];

type AlertLevel =
  | "critico"
  | "advertencia"
  | "normal";

interface RackAlert {
  rack: number;
  temperature: number;
  humidity: number;
  airflow: number;
  cpu_load: number;
  power_kw: number;
  recorded_at: string;
  level: AlertLevel;
  title: string;
  message: string;
}

function getAlert(
  telemetry: Telemetry
): RackAlert {
  const temperature = Number(
    telemetry.temperature
  );

  let level: AlertLevel;
  let title: string;
  let message: string;

  if (temperature >= 27) {
    level = "critico";
    title = "Temperatura crítica";
    message =
      "El rack supera el umbral térmico crítico. Se recomienda revisar inmediatamente la ventilación.";
  } else if (temperature >= 25.5) {
    level = "advertencia";
    title = "Temperatura elevada";
    message =
      "La temperatura está por encima del nivel normal. Se recomienda supervisar el flujo de aire.";
  } else {
    level = "normal";
    title = "Condiciones normales";
    message =
      "La temperatura del rack se encuentra dentro del rango operativo definido.";
  }

  return {
    rack: Number(telemetry.rack),
    temperature,
    humidity: Number(telemetry.humidity),
    airflow: Number(telemetry.airflow),
    cpu_load: Number(telemetry.cpu_load),
    power_kw: Number(telemetry.power_kw),
    recorded_at: telemetry.recorded_at,
    level,
    title,
    message,
  };
}

function getLatestTelemetry(
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
          new Date(
            current.recorded_at
          ).getTime()
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

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<
    RackAlert[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const loadAlerts = useCallback(
    async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const telemetry =
          await getTelemetry();

        const latest =
          getLatestTelemetry(
            telemetry
          );

        const generatedAlerts =
          latest.map(getAlert);

        setAlerts(generatedAlerts);
      } catch (err: any) {
        console.error(
          "Error cargando alertas:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "No se pudieron obtener las alertas."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAlerts();

    const interval = setInterval(() => {
      loadAlerts();
    }, 5000);

    return () =>
      clearInterval(interval);
  }, [loadAlerts]);

  const criticalCount =
    alerts.filter(
      (alert) =>
        alert.level === "critico"
    ).length;

  const warningCount =
    alerts.filter(
      (alert) =>
        alert.level === "advertencia"
    ).length;

  const normalCount =
    alerts.filter(
      (alert) =>
        alert.level === "normal"
    ).length;

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#10B981"
          />

          <Text style={styles.loadingText}>
            Analizando telemetría...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={
          false
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() =>
              loadAlerts(true)
            }
            tintColor="#10B981"
          />
        }
      >
        {/* HEADER */}
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
              Alertas
            </Text>

            <Text style={styles.subtitle}>
              Monitoreo térmico en tiempo real
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() =>
              loadAlerts(true)
            }
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

        {/* ERROR */}
        {error ? (
          <View style={styles.errorBox}>
            <Text
              style={styles.errorTitle}
            >
              Error de conexión
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                loadAlerts(true)
              }
            >
              <Text
                style={styles.retryText}
              >
                REINTENTAR
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* SUMMARY */}
        <View style={styles.summary}>
          <SummaryItem
            value={criticalCount}
            label="CRÍTICAS"
            color="#EF4444"
          />

          <SummaryItem
            value={warningCount}
            label="ADVERTENCIAS"
            color="#F59E0B"
          />

          <SummaryItem
            value={normalCount}
            label="NORMALES"
            color="#10B981"
          />
        </View>

        {/* ALERT LIST */}
        <View style={styles.sectionHeader}>
          <AlertTriangle
            size={20}
            color="#F59E0B"
          />

          <Text
            style={styles.sectionTitle}
          >
            ESTADO DE LOS RACKS
          </Text>
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyBox}>
            <CheckCircle2
              size={40}
              color="#10B981"
            />

            <Text style={styles.emptyTitle}>
              Sin datos
            </Text>

            <Text style={styles.emptyText}>
              No hay telemetría disponible
              para los racks monitoreados.
            </Text>
          </View>
        ) : (
          alerts.map((alert) => (
            <AlertCard
              key={alert.rack}
              alert={alert}
              onPress={() =>
                router.push({
                  pathname:
                    "/rack/id",
                  params: {
                    id: String(
                      alert.rack
                    ),
                  },
                })
              }
            />
          ))
        )}

        <View style={{ height: 35 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.summaryItem}>
      <Text
        style={[
          styles.summaryValue,
          { color },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function AlertCard({
  alert,
  onPress,
}: {
  alert: RackAlert;
  onPress: () => void;
}) {
  const isCritical =
    alert.level === "critico";

  const isWarning =
    alert.level === "advertencia";

  const color = isCritical
    ? "#EF4444"
    : isWarning
      ? "#F59E0B"
      : "#10B981";

  const background = isCritical
    ? "rgba(239,68,68,0.10)"
    : isWarning
      ? "rgba(245,158,11,0.10)"
      : "rgba(16,185,129,0.08)";

  return (
    <TouchableOpacity
      style={styles.alertCard}
      activeOpacity={0.75}
      onPress={onPress}
    >
      <View
        style={[
          styles.alertIcon,
          {
            backgroundColor:
              background,
          },
        ]}
      >
        {isCritical ? (
          <XCircle
            size={22}
            color={color}
          />
        ) : isWarning ? (
          <AlertTriangle
            size={22}
            color={color}
          />
        ) : (
          <CheckCircle2
            size={22}
            color={color}
          />
        )}
      </View>

      <View style={styles.alertContent}>
        <View
          style={styles.alertTopRow}
        >
          <Text style={styles.rackName}>
            RACK #
            {String(
              alert.rack
            ).padStart(2, "0")}
          </Text>

          <Text
            style={[
              styles.levelText,
              { color },
            ]}
          >
            {alert.level ===
            "critico"
              ? "CRÍTICO"
              : alert.level ===
                  "advertencia"
                ? "ADVERTENCIA"
                : "NORMAL"}
          </Text>
        </View>

        <Text
          style={[
            styles.alertTitle,
            { color },
          ]}
        >
          {alert.title}
        </Text>

        <Text style={styles.alertMessage}>
          {alert.message}
        </Text>

        <View
          style={styles.temperatureRow}
        >
          <Thermometer
            size={16}
            color={color}
          />

          <Text
            style={[
              styles.temperature,
              { color },
            ]}
          >
            {alert.temperature.toFixed(
              1
            )}
            °C
          </Text>

          <Text
            style={styles.timestamp}
          >
            {new Date(
              alert.recorded_at
            ).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.details}>
          <Detail
            label="CPU"
            value={`${alert.cpu_load.toFixed(
              1
            )}%`}
          />

          <Detail
            label="HUMEDAD"
            value={`${alert.humidity.toFixed(
              1
            )}%`}
          />

          <Detail
            label="AIRFLOW"
            value={`${alert.airflow.toFixed(
              1
            )}%`}
          />

          <Detail
            label="POTENCIA"
            value={`${alert.power_kw.toFixed(
              1
            )} kW`}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {value}
      </Text>
    </View>
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
    gap: 12,
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
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },

  summary: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    paddingVertical: 17,
    flexDirection: "row",
    justifyContent: "space-around",
  },

  summaryItem: {
    alignItems: "center",
  },

  summaryValue: {
    fontSize: 25,
    fontWeight: "800",
  },

  summaryLabel: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 23,
    marginBottom: 11,
  },

  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  alertCard: {
    flexDirection: "row",
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    padding: 14,
    marginBottom: 10,
  },

  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  alertContent: {
    flex: 1,
  },

  alertTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rackName: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
  },

  levelText: {
    fontSize: 8,
    fontWeight: "900",
  },

  alertTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginTop: 8,
  },

  alertMessage: {
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  temperatureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 5,
  },

  temperature: {
    fontSize: 17,
    fontWeight: "800",
  },

  timestamp: {
    color: "#475569",
    fontSize: 9,
    marginLeft: "auto",
  },

  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#243049",
    marginTop: 12,
    paddingTop: 10,
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

  emptyBox: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    padding: 30,
    alignItems: "center",
  },

  emptyTitle: {
    color: "#E2E8F0",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
  },

  emptyText: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 6,
  },

  errorBox: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#7F1D1D",
    borderRadius: 16,
    padding: 17,
  },

  errorTitle: {
    color: "#FCA5A5",
    fontSize: 15,
    fontWeight: "700",
  },

  errorText: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 7,
    lineHeight: 18,
  },

  retryButton: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    marginTop: 14,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 12,
  },
});