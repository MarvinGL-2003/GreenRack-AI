import React, { useCallback, useEffect, useState } from "react";
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
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  Gauge,
  Server,
  Thermometer,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react-native";

import { getHealth, getMetrics, AIHealth, AIMetrics } from "../services/api";

const COLORS = {
  background: "#0A0F1C",
  card: "#111827",
  cardLight: "#172033",
  border: "#243047",
  primary: "#22C55E",
  blue: "#3B82F6",
  cyan: "#06B6D4",
  yellow: "#F59E0B",
  red: "#EF4444",
  text: "#F8FAFC",
  muted: "#94A3B8",
};

const racks = [
  { id: 1, temperature: 23.8, cpu: 42, airflow: 72, power: 211 },
  { id: 2, temperature: 24.2, cpu: 48, airflow: 70, power: 218 },
  { id: 3, temperature: 23.5, cpu: 39, airflow: 74, power: 205 },
  { id: 4, temperature: 24.7, cpu: 53, airflow: 68, power: 225 },
  { id: 5, temperature: 25.1, cpu: 58, airflow: 63, power: 231 },
  { id: 6, temperature: 25.8, cpu: 61, airflow: 55, power: 239 },
  { id: 7, temperature: 23.9, cpu: 45, airflow: 71, power: 214 },
  { id: 8, temperature: 24.4, cpu: 50, airflow: 69, power: 221 },
  { id: 9, temperature: 24.0, cpu: 43, airflow: 73, power: 209 },
  { id: 10, temperature: 24.8, cpu: 55, airflow: 66, power: 228 },
  { id: 11, temperature: 25.2, cpu: 59, airflow: 62, power: 235 },
  { id: 12, temperature: 27.9, cpu: 78, airflow: 55, power: 245 },
  { id: 13, temperature: 23.7, cpu: 41, airflow: 75, power: 207 },
  { id: 14, temperature: 24.1, cpu: 46, airflow: 71, power: 216 },
  { id: 15, temperature: 24.6, cpu: 51, airflow: 68, power: 224 },
  { id: 16, temperature: 24.9, cpu: 56, airflow: 65, power: 230 },
  { id: 17, temperature: 25.0, cpu: 57, airflow: 64, power: 233 },
  { id: 18, temperature: 26.3, cpu: 67, airflow: 58, power: 241 },
  { id: 19, temperature: 23.6, cpu: 40, airflow: 74, power: 206 },
  { id: 20, temperature: 24.3, cpu: 47, airflow: 70, power: 219 },
  { id: 21, temperature: 24.5, cpu: 49, airflow: 69, power: 220 },
  { id: 22, temperature: 24.9, cpu: 54, airflow: 66, power: 229 },
  { id: 23, temperature: 25.3, cpu: 60, airflow: 62, power: 237 },
  { id: 24, temperature: 24.0, cpu: 44, airflow: 72, power: 212 },
];

function getStatus(temperature: number) {
  if (temperature >= 27) {
    return {
      label: "Crítico",
      color: COLORS.red,
    };
  }

  if (temperature >= 25.5) {
    return {
      label: "Advertencia",
      color: COLORS.yellow,
    };
  }

  return {
    label: "Normal",
    color: COLORS.primary,
  };
}

function MetricCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>{icon}</View>

      <Text style={styles.metricTitle}>{title}</Text>

      <Text style={styles.metricValue}>{value}</Text>

      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );
}

export default function Dashboard() {
  const [health, setHealth] = useState<AIHealth | null>(null);
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const criticalRacks = racks.filter(
    (rack) => rack.temperature >= 27
  );

  const warningRacks = racks.filter(
    (rack) => rack.temperature >= 25.5 && rack.temperature < 27
  );

  const averageTemperature =
    racks.reduce((sum, rack) => sum + rack.temperature, 0) /
    racks.length;

  const loadData = useCallback(async () => {
    try {
      const [healthData, metricsData] = await Promise.all([
        getHealth(),
        getMetrics(),
      ]);

      setHealth(healthData);
      setMetrics(metricsData);
    } catch (error) {
      console.log("Error conectando con GreenRack:", error);
      setHealth(null);
      setMetrics(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 15000);

    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const connected = health?.status === "ok";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Activity size={22} color={COLORS.primary} />
              </View>

              <Text style={styles.brand}>GreenRack</Text>
            </View>

            <Text style={styles.title}>Centro de control</Text>

            <Text style={styles.subtitle}>
              Monitoreo inteligente del data center
            </Text>
          </View>

          <View
            style={[
              styles.connection,
              {
                borderColor: connected
                  ? "rgba(34,197,94,0.35)"
                  : "rgba(239,68,68,0.35)",
              },
            ]}
          >
            {connected ? (
              <Wifi size={17} color={COLORS.primary} />
            ) : (
              <WifiOff size={17} color={COLORS.red} />
            )}

            <Text
              style={[
                styles.connectionText,
                {
                  color: connected
                    ? COLORS.primary
                    : COLORS.red,
                },
              ]}
            >
              {connected ? "ONLINE" : "OFFLINE"}
            </Text>
          </View>
        </View>

        {/* SYSTEM STATUS */}

        <View style={styles.systemCard}>
          <View style={styles.systemLeft}>
            <View style={styles.onlineDot} />

            <View>
              <Text style={styles.systemTitle}>
                Sistema operativo
              </Text>

              <Text style={styles.systemSubtitle}>
                Backend + Servicio IA
              </Text>
            </View>
          </View>

          <CheckCircle2
            size={26}
            color={connected ? COLORS.primary : COLORS.red}
          />
        </View>

        {/* METRICS */}

        <Text style={styles.sectionTitle}>Resumen del sistema</Text>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon={
              <Thermometer
                size={20}
                color={COLORS.cyan}
              />
            }
            title="Temperatura"
            value={`${averageTemperature.toFixed(1)}°C`}
            subtitle="Promedio de racks"
          />

          <MetricCard
            icon={
              <Server
                size={20}
                color={COLORS.blue}
              />
            }
            title="Racks"
            value="24"
            subtitle="Monitoreados"
          />

          <MetricCard
            icon={
              <AlertTriangle
                size={20}
                color={COLORS.red}
              />
            }
            title="Críticos"
            value={String(criticalRacks.length)}
            subtitle="Requieren atención"
          />

          <MetricCard
            icon={
              <Gauge
                size={20}
                color={COLORS.yellow}
              />
            }
            title="Advertencias"
            value={String(warningRacks.length)}
            subtitle="Bajo observación"
          />
        </View>

        {/* AI */}

        <Text style={styles.sectionTitle}>
          Inteligencia artificial
        </Text>

        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIcon}>
              <Brain size={24} color={COLORS.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>
                GreenRack Predictive AI
              </Text>

              <Text style={styles.aiSubtitle}>
                Predicción térmica a 15 minutos
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />
            ) : (
              <View
                style={[
                  styles.aiBadge,
                  {
                    backgroundColor: connected
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(239,68,68,0.12)",
                  },
                ]}
              >
                <Text
                  style={{
                    color: connected
                      ? COLORS.primary
                      : COLORS.red,
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {connected ? "ACTIVA" : "SIN CONEXIÓN"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.modelRow}>
            <View style={styles.model}>
              <Cpu size={17} color={COLORS.blue} />
              <Text style={styles.modelName}>XGBoost</Text>

              <Text style={styles.modelValue}>
                {metrics
                  ? `MAE ${metrics.metrics.xgboost.mae_c.toFixed(
                      3
                    )}°C`
                  : "--"}
              </Text>
            </View>

            <View style={styles.model}>
              <Brain size={17} color={COLORS.primary} />
              <Text style={styles.modelName}>LSTM</Text>

              <Text style={styles.modelValue}>
                {metrics
                  ? `MAE ${metrics.metrics.lstm.mae_c.toFixed(
                      3
                    )}°C`
                  : "--"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => router.push("/predictive")}
          >
            <Text style={styles.aiButtonText}>
              Abrir centro predictivo
            </Text>

            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ALERTS */}

        <Text style={styles.sectionTitle}>
          Atención requerida
        </Text>

        {criticalRacks.map((rack) => {
          const status = getStatus(rack.temperature);

          return (
         <TouchableOpacity
  key={rack.id}
  style={styles.alertCard}
  onPress={() =>
    router.push({
      pathname: "/rack/id",
      params: { id: String(rack.id) },
    })
  }
>
              <View
                style={[
                  styles.alertIcon,
                  {
                    backgroundColor:
                      "rgba(239,68,68,0.12)",
                  },
                ]}
              >
                <AlertTriangle
                  size={20}
                  color={status.color}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.alertTitle}>
                  Rack {rack.id} · {status.label}
                </Text>

                <Text style={styles.alertSubtitle}>
                  Temperatura {rack.temperature.toFixed(1)}°C
                  · CPU {rack.cpu}%
                </Text>
              </View>

              <ArrowRight
                size={18}
                color={COLORS.muted}
              />
            </TouchableOpacity>
          );
        })}

        {warningRacks.slice(0, 2).map((rack) => (
        <TouchableOpacity
  key={rack.id}
  style={styles.alertCard}
  onPress={() =>
    router.push({
      pathname: "/rack/id",
      params: { id: String(rack.id) },
    })
  }
>
            <View
              style={[
                styles.alertIcon,
                {
                  backgroundColor:
                    "rgba(245,158,11,0.12)",
                },
              ]}
            >
              <AlertTriangle
                size={20}
                color={COLORS.yellow}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                Rack {rack.id} · Advertencia
              </Text>

              <Text style={styles.alertSubtitle}>
                Temperatura {rack.temperature.toFixed(1)}°C
              </Text>
            </View>

            <ArrowRight
              size={18}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        ))}

        {/* QUICK ACTIONS */}

        <Text style={styles.sectionTitle}>
          Acciones rápidas
        </Text>

        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/racks")}
          >
            <Server size={22} color={COLORS.blue} />
            <Text style={styles.actionText}>Ver racks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/predictive")}
          >
            <Brain size={22} color={COLORS.primary} />
            <Text style={styles.actionText}>Predicción</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/alerts")}
          >
            <AlertTriangle
              size={22}
              color={COLORS.yellow}
            />
            <Text style={styles.actionText}>Alertas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
          >
            <Zap size={22} color={COLORS.cyan} />
            <Text style={styles.actionText}>Energía</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 12,
    paddingBottom: 20,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(34,197,94,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },

  title: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 18,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 5,
  },

  connection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  connectionText: {
    fontSize: 10,
    fontWeight: "800",
  },

  systemCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  systemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },

  systemTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },

  systemSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 25,
    marginBottom: 12,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  metricCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },

  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.cardLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  metricTitle: {
    color: COLORS.muted,
    fontSize: 11,
  },

  metricValue: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "800",
    marginTop: 3,
  },

  metricSubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  aiCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },

  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  aiIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  aiTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },

  aiSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },

  aiBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },

  modelRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  model: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 12,
    padding: 12,
  },

  modelName: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 12,
    marginTop: 6,
  },

  modelValue: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 4,
  },

  aiButton: {
    marginTop: 13,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },

  aiButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  alertCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 13,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  alertIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  alertTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  alertSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  actionButton: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 17,
    alignItems: "center",
    gap: 8,
  },

  actionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
});