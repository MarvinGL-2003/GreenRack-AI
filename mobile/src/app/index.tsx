
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import axios from "axios";

// IMPORTANTE:
// Cambia esta IP por la IP de tu computadora Fedora.
// Puedes verla con: hostname -I
const API_URL = "http://192.168.0.13:4000";

type Rack = {
  id: number;
  pasillo: string;
  fila: number;
  temperature: number;
  humidity: number;
  cpu_load: number;
  airflow: number;
  power_kw: number;
  status: "normal" | "warning" | "critical";
};

type Health = {
  status: string;
  models?: {
    xgboost: boolean;
    lstm: boolean;
  };
};

type Metrics = {
  status: string;
  metrics?: {
    xgboost: {
      mae_c: number;
      rmse_c: number;
    };
    lstm: {
      mae_c: number;
      rmse_c: number;
    };
    prediction_horizon_minutes: number;
  };
};

const initialRacks: Rack[] = [
  {
    id: 1,
    pasillo: "A",
    fila: 1,
    temperature: 24.2,
    humidity: 48,
    cpu_load: 52,
    airflow: 75,
    power_kw: 180,
    status: "normal",
  },
  {
    id: 6,
    pasillo: "A",
    fila: 6,
    temperature: 25.8,
    humidity: 48,
    cpu_load: 65,
    airflow: 55,
    power_kw: 210,
    status: "warning",
  },
  {
    id: 12,
    pasillo: "B",
    fila: 6,
    temperature: 27.9,
    humidity: 48,
    cpu_load: 78,
    airflow: 55,
    power_kw: 245,
    status: "critical",
  },
  {
    id: 18,
    pasillo: "C",
    fila: 6,
    temperature: 26.3,
    humidity: 48,
    cpu_load: 70,
    airflow: 62,
    power_kw: 225,
    status: "warning",
  },
];

function getStatusColor(status: Rack["status"]) {
  switch (status) {
    case "critical":
      return "#EF4444";
    case "warning":
      return "#F59E0B";
    default:
      return "#22C55E";
  }
}

function getStatusText(status: Rack["status"]) {
  switch (status) {
    case "critical":
      return "CRÍTICO";
    case "warning":
      return "ADVERTENCIA";
    default:
      return "NORMAL";
  }
}

export default function HomeScreen() {
  const [racks, setRacks] = useState<Rack[]>(initialRacks);
  const [health, setHealth] = useState<Health | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/ai/health`, {
          timeout: 5000,
        }),
        axios.get(`${API_URL}/api/ai/metrics`, {
          timeout: 5000,
        }),
      ]);

      setHealth(healthResponse.data);
      setMetrics(metricsResponse.data);
    } catch (error) {
      console.log("Error conectando con GreenRack:", error);
      setHealth(null);
      setMetrics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const criticalRacks = racks.filter(
    (rack) => rack.status === "critical"
  ).length;

  const warningRacks = racks.filter(
    (rack) => rack.status === "warning"
  ).length;

  const averageTemperature =
    racks.reduce((sum, rack) => sum + rack.temperature, 0) /
    racks.length;

  const totalPower = racks.reduce(
    (sum, rack) => sum + rack.power_kw,
    0
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#22C55E"
          />
        }
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>GREENRACK</Text>
            <Text style={styles.title}>AI Mobile</Text>
          </View>

          <View
            style={[
              styles.connectionBadge,
              {
                borderColor: health
                  ? "#22C55E"
                  : "#EF4444",
              },
            ]}
          >
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor: health
                    ? "#22C55E"
                    : "#EF4444",
                },
              ]}
            />
            <Text style={styles.connectionText}>
              {health ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        {/* RESUMEN */}
        <Text style={styles.sectionTitle}>Resumen del sistema</Text>

        <View style={styles.grid}>
          <MetricCard
            title="Temperatura"
            value={`${averageTemperature.toFixed(1)}°C`}
            subtitle="Promedio"
          />

          <MetricCard
            title="Consumo"
            value={`${totalPower.toFixed(0)} kW`}
            subtitle="Total estimado"
          />

          <MetricCard
            title="Críticos"
            value={criticalRacks.toString()}
            subtitle="Racks"
            danger
          />

          <MetricCard
            title="Advertencias"
            value={warningRacks.toString()}
            subtitle="Racks"
            warning
          />
        </View>

        {/* IA */}
        <Text style={styles.sectionTitle}>Servicio de IA</Text>

        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View>
              <Text style={styles.aiTitle}>
                GreenRack Predictive AI
              </Text>
              <Text style={styles.aiSubtitle}>
                Predicción térmica a{" "}
                {metrics?.metrics?.prediction_horizon_minutes ?? 15} minutos
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator color="#22C55E" />
            ) : (
              <View
                style={[
                  styles.aiStatus,
                  {
                    backgroundColor: health
                      ? "#163D2A"
                      : "#3D1616",
                  },
                ]}
              >
                <Text
                  style={{
                    color: health ? "#22C55E" : "#EF4444",
                    fontWeight: "700",
                  }}
                >
                  {health ? "ACTIVA" : "ERROR"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.modelRow}>
            <ModelStatus
              name="XGBoost"
              active={health?.models?.xgboost ?? false}
            />

            <ModelStatus
              name="LSTM"
              active={health?.models?.lstm ?? false}
            />
          </View>

          {metrics?.metrics && (
            <View style={styles.metricsRow}>
              <View>
                <Text style={styles.smallLabel}>
                  MAE XGBoost
                </Text>
                <Text style={styles.metricValue}>
                  {metrics.metrics.xgboost.mae_c.toFixed(3)}°C
                </Text>
              </View>

              <View>
                <Text style={styles.smallLabel}>
                  MAE LSTM
                </Text>
                <Text style={styles.metricValue}>
                  {metrics.metrics.lstm.mae_c.toFixed(3)}°C
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* RACKS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Racks con atención
          </Text>

          <Text style={styles.rackCount}>
            {racks.length} monitoreados
          </Text>
        </View>

        {racks
          .filter((rack) => rack.status !== "normal")
          .map((rack) => (
            <RackCard key={rack.id} rack={rack} />
          ))}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            GreenRack AI
          </Text>

          <Text style={styles.footerSubtext}>
            Monitoreo inteligente de infraestructura
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  danger,
  warning,
}: {
  title: string;
  value: string;
  subtitle: string;
  danger?: boolean;
  warning?: boolean;
}) {
  let valueColor = "#F8FAFC";

  if (danger) valueColor = "#EF4444";
  if (warning) valueColor = "#F59E0B";

  return (
    <View style={styles.metricCard}>
      <Text style={styles.cardTitle}>{title}</Text>

      <Text
        style={[
          styles.bigValue,
          {
            color: valueColor,
          },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.cardSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function ModelStatus({
  name,
  active,
}: {
  name: string;
  active: boolean;
}) {
  return (
    <View style={styles.modelItem}>
      <View
        style={[
          styles.modelDot,
          {
            backgroundColor: active
              ? "#22C55E"
              : "#EF4444",
          },
        ]}
      />

      <Text style={styles.modelText}>
        {name}
      </Text>

      <Text
        style={[
          styles.modelState,
          {
            color: active
              ? "#22C55E"
              : "#EF4444",
          },
        ]}
      >
        {active ? "OK" : "ERROR"}
      </Text>
    </View>
  );
}

function RackCard({ rack }: { rack: Rack }) {
  const statusColor = getStatusColor(rack.status);

  return (
    <View
      style={[
        styles.rackCard,
        {
          borderLeftColor: statusColor,
        },
      ]}
    >
      <View style={styles.rackHeader}>
        <View>
          <Text style={styles.rackName}>
            Rack {rack.id}
          </Text>

          <Text style={styles.rackLocation}>
            Pasillo {rack.pasillo} · Fila {rack.fila}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${statusColor}22`,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                color: statusColor,
              },
            ]}
          >
            {getStatusText(rack.status)}
          </Text>
        </View>
      </View>

      <View style={styles.rackMetrics}>
        <RackMetric
          label="TEMP"
          value={`${rack.temperature.toFixed(1)}°C`}
        />

        <RackMetric
          label="CPU"
          value={`${rack.cpu_load}%`}
        />

        <RackMetric
          label="AIRFLOW"
          value={`${rack.airflow}%`}
        />

        <RackMetric
          label="POWER"
          value={`${rack.power_kw} kW`}
        />
      </View>
    </View>
  );
}

function RackMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.rackMetric}>
      <Text style={styles.rackMetricLabel}>
        {label}
      </Text>

      <Text style={styles.rackMetricValue}>
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
    backgroundColor: "#0A0F1C",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  brand: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 2,
  },

  title: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 3,
  },

  connectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#131B2E",
  },

  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  connectionText: {
    color: "#F8FAFC",
    fontSize: 11,
    fontWeight: "700",
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 28,
    marginBottom: 14,
  },

  rackCount: {
    color: "#64748B",
    fontSize: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 26,
  },

  metricCard: {
    width: "48%",
    backgroundColor: "#131B2E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  cardTitle: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },

  bigValue: {
    fontSize: 25,
    fontWeight: "800",
    marginTop: 8,
  },

  cardSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 4,
  },

  aiCard: {
    backgroundColor: "#131B2E",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1E293B",
  },

  aiHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  aiTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },

  aiSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },

  aiStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  modelRow: {
    marginTop: 20,
    gap: 10,
  },

  modelItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A0F1C",
    borderRadius: 10,
    padding: 11,
  },

  modelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },

  modelText: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  modelState: {
    fontSize: 11,
    fontWeight: "800",
  },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },

  smallLabel: {
    color: "#64748B",
    fontSize: 10,
  },

  metricValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 3,
  },

  rackCard: {
    backgroundColor: "#131B2E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },

  rackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rackName: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },

  rackLocation: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  rackMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },

  rackMetric: {
    alignItems: "center",
  },

  rackMetricLabel: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "700",
  },

  rackMetricValue: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  footer: {
    alignItems: "center",
    marginTop: 35,
  },

  footerText: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1,
  },

  footerSubtext: {
    color: "#475569",
    fontSize: 10,
    marginTop: 5,
  },
});

