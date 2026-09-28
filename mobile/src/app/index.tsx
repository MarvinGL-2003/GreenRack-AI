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
  UserCircle,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react-native";

import {
  getHealth,
  getMetrics,
  getTelemetry,
  AIHealth,
  AIMetrics,
  Telemetry,
} from "../services/api";

const COLORS = {
  background: "#0A0F1C",
  card: "#131B2E",
  cardLight: "#1A2338",
  border: "#243049",
  primary: "#10B981",
  blue: "#2563EB",
  cyan: "#06B6D4",
  yellow: "#F59E0B",
  red: "#EF4444",
  text: "#E2E8F0",
  muted: "#64748B",
};

const ACTIVE_RACKS = [1, 6, 12, 18];

type RackData = {
  id: number;
  temperature: number;
  humidity: number;
  cpu: number;
  airflow: number;
  power: number;
  recorded_at: string;
};

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

function getLatestRacks(
  telemetry: Telemetry[]
): RackData[] {
  const latestByRack = new Map<number, Telemetry>();

  telemetry.forEach((item) => {
    if (!ACTIVE_RACKS.includes(Number(item.rack))) {
      return;
    }

    const rackNumber = Number(item.rack);
    const current = latestByRack.get(rackNumber);

    if (
      !current ||
      new Date(item.recorded_at).getTime() >
        new Date(current.recorded_at).getTime()
    ) {
      latestByRack.set(rackNumber, item);
    }
  });

  return ACTIVE_RACKS.map((rackNumber) => {
    const item = latestByRack.get(rackNumber);

    if (!item) {
      return null;
    }

    return {
      id: rackNumber,
      temperature: Number(item.temperature),
      humidity: Number(item.humidity),
      cpu: Number(item.cpu_load),
      airflow: Number(item.airflow),
      power: Number(item.power_kw),
      recorded_at: item.recorded_at,
    };
  }).filter(Boolean) as RackData[];
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
      <View style={styles.metricIcon}>
        {icon}
      </View>

      <Text style={styles.metricTitle}>
        {title}
      </Text>

      <Text style={styles.metricValue}>
        {value}
      </Text>

      <Text style={styles.metricSubtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

function RackCard({ rack }: { rack: RackData }) {
  const status = getStatus(rack.temperature);

  return (
    <TouchableOpacity
      style={styles.rackCard}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/rack/id",
          params: {
            id: String(rack.id),
          },
        })
      }
    >
      <View style={styles.rackHeader}>
        <View>
          <Text style={styles.rackLabel}>
            Rack #{String(rack.id).padStart(2, "0")}
          </Text>

          <Text style={styles.rackTemperature}>
            {rack.temperature.toFixed(1)}°C
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${status.color}1F`,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: status.color,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: status.color,
              },
            ]}
          >
            {status.label}
          </Text>
        </View>
      </View>

      <View style={styles.rackMetrics}>
        <View style={styles.rackMetric}>
          <Cpu size={15} color={COLORS.blue} />

          <Text style={styles.rackMetricValue}>
            {rack.cpu.toFixed(1)}%
          </Text>

          <Text style={styles.rackMetricLabel}>
            CPU
          </Text>
        </View>

        <View style={styles.rackMetric}>
          <Activity size={15} color={COLORS.cyan} />

          <Text style={styles.rackMetricValue}>
            {rack.airflow.toFixed(1)}
          </Text>

          <Text style={styles.rackMetricLabel}>
            Airflow
          </Text>
        </View>

        <View style={styles.rackMetric}>
          <Zap size={15} color={COLORS.yellow} />

          <Text style={styles.rackMetricValue}>
            {rack.power.toFixed(1)}
          </Text>

          <Text style={styles.rackMetricLabel}>
            kW
          </Text>
        </View>
      </View>

      <View style={styles.rackFooter}>
        <Text style={styles.humidityText}>
          Humedad {rack.humidity.toFixed(1)}%
        </Text>

        <ArrowRight
          size={17}
          color={COLORS.muted}
        />
      </View>
    </TouchableOpacity>
  );
}

export default function Dashboard() {
  const [telemetry, setTelemetry] =
    useState<RackData[]>([]);

  const [health, setHealth] =
    useState<AIHealth | null>(null);

  const [metrics, setMetrics] =
    useState<AIMetrics | null>(null);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const loadData = useCallback(async () => {
    try {
      const [
        telemetryData,
        healthData,
        metricsData,
      ] = await Promise.all([
        getTelemetry(),
        getHealth(),
        getMetrics(),
      ]);

      setTelemetry(
        getLatestRacks(telemetryData)
      );

      setHealth(healthData);
      setMetrics(metricsData);
    } catch (error) {
      console.log(
        "Error conectando con GreenRack:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = setInterval(
      loadData,
      5000
    );

    return () => clearInterval(interval);
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const connected =
    health?.status === "ok";

  const criticalRacks =
    telemetry.filter(
      (rack) => rack.temperature >= 27
    );

  const warningRacks =
    telemetry.filter(
      (rack) =>
        rack.temperature >= 25.5 &&
        rack.temperature < 27
    );

  const averageTemperature =
    telemetry.length > 0
      ? telemetry.reduce(
          (sum, rack) =>
            sum + rack.temperature,
          0
        ) / telemetry.length
      : 0;

  const totalPower = telemetry.reduce(
    (sum, rack) => sum + rack.power,
    0
  );

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
          <View style={styles.headerInfo}>
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Activity
                  size={22}
                  color={COLORS.primary}
                />
              </View>

              <Text style={styles.brand}>
                GreenRack AI
              </Text>
            </View>

            <Text style={styles.title}>
              Centro de control
            </Text>

            <Text style={styles.subtitle}>
              Monitoreo inteligente del data center
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/explore")
              }
            >
              <UserCircle
                size={21}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            <View
              style={[
                styles.connection,
                {
                  borderColor: connected
                    ? `${COLORS.primary}59`
                    : `${COLORS.red}59`,
                },
              ]}
            >
              {connected ? (
                <Wifi
                  size={17}
                  color={COLORS.primary}
                />
              ) : (
                <WifiOff
                  size={17}
                  color={COLORS.red}
                />
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
                {connected
                  ? "ONLINE"
                  : "OFFLINE"}
              </Text>
            </View>
          </View>
        </View>

        {/* SYSTEM STATUS */}

        <View style={styles.systemCard}>
          <View style={styles.systemLeft}>
            <View
              style={[
                styles.onlineDot,
                {
                  backgroundColor: connected
                    ? COLORS.primary
                    : COLORS.red,
                },
              ]}
            />

            <View>
              <Text style={styles.systemTitle}>
                {connected
                  ? "Sistema operativo"
                  : "Sistema sin conexión"}
              </Text>

              <Text
                style={styles.systemSubtitle}
              >
                MQTT + Backend + PostgreSQL + IA
              </Text>
            </View>
          </View>

          <CheckCircle2
            size={26}
            color={
              connected
                ? COLORS.primary
                : COLORS.red
            }
          />
        </View>

        {/* SUMMARY */}

        <Text style={styles.sectionTitle}>
          Resumen del sistema
        </Text>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon={
              <Thermometer
                size={20}
                color={COLORS.cyan}
              />
            }
            title="Temperatura"
            value={
              telemetry.length > 0
                ? `${averageTemperature.toFixed(
                    1
                  )}°C`
                : "--"
            }
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
            value={String(
              telemetry.length
            )}
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
            value={String(
              criticalRacks.length
            )}
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
            value={String(
              warningRacks.length
            )}
            subtitle="Bajo observación"
          />
        </View>

        {/* RACKS */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Racks monitoreados
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Telemetría IoT en tiempo real
            </Text>
          </View>

          <TouchableOpacity
            onPress={() =>
              router.push("/racks")
            }
          >
            <Text style={styles.viewAll}>
              Ver todos
            </Text>
          </TouchableOpacity>
        </View>

        {loading &&
        telemetry.length === 0 ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />

            <Text style={styles.loadingText}>
              Cargando telemetría...
            </Text>
          </View>
        ) : telemetry.length === 0 ? (
          <View style={styles.emptyCard}>
            <WifiOff
              size={28}
              color={COLORS.muted}
            />

            <Text style={styles.emptyTitle}>
              Sin telemetría
            </Text>

            <Text style={styles.emptyText}>
              No se encontraron datos de los
              racks monitoreados.
            </Text>
          </View>
        ) : (
          telemetry.map((rack) => (
            <RackCard
              key={rack.id}
              rack={rack}
            />
          ))
        )}

        {/* AI */}

        <Text style={styles.sectionTitle}>
          Inteligencia artificial
        </Text>

        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIcon}>
              <Brain
                size={24}
                color={COLORS.primary}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.aiTitle}>
                GreenRack Predictive AI
              </Text>

              <Text
                style={styles.aiSubtitle}
              >
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
                      ? `${COLORS.primary}1F`
                      : `${COLORS.red}1F`,
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
                  {connected
                    ? "ACTIVA"
                    : "SIN CONEXIÓN"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.modelRow}>
            <View style={styles.model}>
              <Cpu
                size={17}
                color={COLORS.blue}
              />

              <Text style={styles.modelName}>
                XGBoost
              </Text>

              <Text style={styles.modelValue}>
                {metrics
                  ? `MAE ${metrics.metrics.xgboost.mae_c.toFixed(
                      3
                    )}°C`
                  : "--"}
              </Text>
            </View>

            <View style={styles.model}>
              <Brain
                size={17}
                color={COLORS.primary}
              />

              <Text style={styles.modelName}>
                LSTM
              </Text>

              <Text style={styles.modelValue}>
                {metrics
                  ? `MAE ${metrics.metrics.lstm.mae_c.toFixed(
                      3
                    )}°C`
                  : "--"}
              </Text>
            </View>
          </View>

          <View style={styles.aiInfo}>
            <Text style={styles.aiInfoText}>
              Horizonte de predicción
            </Text>

            <Text style={styles.aiInfoValue}>
              {metrics?.metrics
                .prediction_horizon_minutes ??
                15}{" "}
              minutos
            </Text>
          </View>

          <TouchableOpacity
            style={styles.aiButton}
            onPress={() =>
              router.push("/predictive")
            }
          >
            <Text style={styles.aiButtonText}>
              Abrir centro predictivo
            </Text>

            <ArrowRight
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* ENERGY */}

        <Text style={styles.sectionTitle}>
          Consumo energético
        </Text>

        <View style={styles.energyCard}>
          <View style={styles.energyIcon}>
            <Zap
              size={22}
              color={COLORS.yellow}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.energyTitle}>
              Potencia actual
            </Text>

            <Text style={styles.energySubtitle}>
              Suma de los racks monitoreados
            </Text>
          </View>

          <Text style={styles.energyValue}>
            {totalPower.toFixed(1)} kW
          </Text>
        </View>

        {/* ALERTS */}

        <Text style={styles.sectionTitle}>
          Atención requerida
        </Text>

        {criticalRacks.map((rack) => (
          <TouchableOpacity
            key={`critical-${rack.id}`}
            style={styles.alertCard}
            onPress={() =>
              router.push({
                pathname: "/rack/id",
                params: {
                  id: String(rack.id),
                },
              })
            }
          >
            <View
              style={[
                styles.alertIcon,
                {
                  backgroundColor:
                    `${COLORS.red}1F`,
                },
              ]}
            >
              <AlertTriangle
                size={20}
                color={COLORS.red}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>
                Rack #
                {String(rack.id).padStart(
                  2,
                  "0"
                )}{" "}
                · Crítico
              </Text>

              <Text
                style={styles.alertSubtitle}
              >
                {rack.temperature.toFixed(1)}°C
                {" · "}
                CPU {rack.cpu.toFixed(1)}%
              </Text>
            </View>

            <ArrowRight
              size={18}
              color={COLORS.muted}
            />
          </TouchableOpacity>
        ))}

        {warningRacks
          .slice(0, 2)
          .map((rack) => (
            <TouchableOpacity
              key={`warning-${rack.id}`}
              style={styles.alertCard}
              onPress={() =>
                router.push({
                  pathname: "/rack/id",
                  params: {
                    id: String(rack.id),
                  },
                })
              }
            >
              <View
                style={[
                  styles.alertIcon,
                  {
                    backgroundColor:
                      `${COLORS.yellow}1F`,
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
                  Rack #
                  {String(rack.id).padStart(
                    2,
                    "0"
                  )}{" "}
                  · Advertencia
                </Text>

                <Text
                  style={styles.alertSubtitle}
                >
                  {rack.temperature.toFixed(1)}°C
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
            onPress={() =>
              router.push("/racks")
            }
          >
            <Server
              size={22}
              color={COLORS.blue}
            />

            <Text style={styles.actionText}>
              Ver racks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push("/predictive")
            }
          >
            <Brain
              size={22}
              color={COLORS.primary}
            />

            <Text style={styles.actionText}>
              Predicción
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              router.push("/alerts")
            }
          >
            <AlertTriangle
              size={22}
              color={COLORS.yellow}
            />

            <Text style={styles.actionText}>
              Alertas
            </Text>
          </TouchableOpacity>

          <View style={styles.actionButton}>
            <Zap
              size={22}
              color={COLORS.cyan}
            />

            <Text style={styles.actionText}>
              Energía
            </Text>
          </View>
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

  headerInfo: {
    flex: 1,
  },

  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
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
    backgroundColor: `${COLORS.primary}1F`,
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

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: -7,
    marginBottom: 12,
  },

  viewAll: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
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

  rackCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 10,
  },

  rackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  rackLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },

  rackTemperature: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    marginTop: 3,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
  },

  rackMetrics: {
    flexDirection: "row",
    marginTop: 15,
    gap: 8,
  },

  rackMetric: {
    flex: 1,
    backgroundColor: COLORS.cardLight,
    borderRadius: 11,
    padding: 10,
  },

  rackMetricValue: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 5,
  },

  rackMetricLabel: {
    color: COLORS.muted,
    fontSize: 9,
    marginTop: 2,
  },

  rackFooter: {
    marginTop: 12,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  humidityText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  loadingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 10,
  },

  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 25,
    alignItems: "center",
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 10,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
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
    backgroundColor: `${COLORS.primary}1F`,
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

  aiInfo: {
    marginTop: 10,
    padding: 11,
    borderRadius: 10,
    backgroundColor: COLORS.cardLight,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  aiInfoText: {
    color: COLORS.muted,
    fontSize: 10,
  },

  aiInfoValue: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "700",
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

  energyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  energyIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: `${COLORS.yellow}1F`,
    alignItems: "center",
    justifyContent: "center",
  },

  energyTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  energySubtitle: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 3,
  },

  energyValue: {
    color: COLORS.text,
    fontSize: 16,
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