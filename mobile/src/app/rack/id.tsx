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
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  Bot,
  Cpu,
  Droplets,
  Gauge,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react-native";

import {
  getTelemetry,
  predictRack,
  Telemetry,
  PredictionResponse,
} from "../../services/api";

function getStatus(temp: number) {
  if (temp >= 27) {
    return {
      label: "CRÍTICO",
      color: "#EF4444",
      background: "rgba(239, 68, 68, 0.12)",
    };
  }

  if (temp >= 25.5) {
    return {
      label: "ADVERTENCIA",
      color: "#F59E0B",
      background: "rgba(245, 158, 11, 0.12)",
    };
  }

  return {
    label: "NORMAL",
    color: "#10B981",
    background: "rgba(16, 185, 129, 0.12)",
  };
}

export default function RackDetailScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const rackId = Number(id);

  const [telemetry, setTelemetry] =
    useState<Telemetry | null>(null);

  const [prediction, setPrediction] =
    useState<PredictionResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [error, setError] = useState("");

  const loadRack = useCallback(async () => {
    try {
      setError("");

      const data = await getTelemetry();

      const rackTelemetry = data
        .filter(
          (item) => Number(item.rack) === rackId
        )
        .sort(
          (a, b) =>
            new Date(b.recorded_at).getTime() -
            new Date(a.recorded_at).getTime()
        );

      if (rackTelemetry.length === 0) {
        setTelemetry(null);
        setError(
          "No existe telemetría para este rack."
        );
        return;
      }

      setTelemetry(rackTelemetry[0]);
    } catch (err: any) {
      console.error(
        "Error cargando rack:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "No se pudo obtener la telemetría."
      );
    } finally {
      setLoading(false);
    }
  }, [rackId]);

  const runPrediction = useCallback(
    async (current: Telemetry) => {
      try {
        setPredicting(true);

        const result = await predictRack(
          rackId,
          {
            temperature: Number(
              current.temperature
            ),
            humidity: Number(
              current.humidity
            ),
            cpu_load: Number(
              current.cpu_load
            ),
            airflow: Number(
              current.airflow
            ),
            power_kw: Number(
              current.power_kw
            ),
          }
        );

        setPrediction(result);
      } catch (err: any) {
        console.error(
          "Error en predicción:",
          err
        );
      } finally {
        setPredicting(false);
      }
    },
    [rackId]
  );

  useEffect(() => {
    loadRack();
  }, [loadRack]);

  useEffect(() => {
    if (!telemetry) {
      return;
    }

    runPrediction(telemetry);
  }, [telemetry, runPrediction]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadRack();
    }, 5000);

    return () => clearInterval(interval);
  }, [loadRack]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#10B981"
          />

          <Text style={styles.loadingText}>
            Cargando rack...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!telemetry) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            No se pudo cargar el rack
          </Text>

          <Text style={styles.errorText}>
            {error ||
              "No existe información disponible."}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadRack}
          >
            <Text style={styles.retryText}>
              REINTENTAR
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const temperature = Number(
    telemetry.temperature
  );

  const status = getStatus(temperature);

  const risk =
    prediction?.risk_percentage ?? 0;

  const riskColor =
    risk >= 70
      ? "#EF4444"
      : risk >= 40
        ? "#F59E0B"
        : "#10B981";

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
            <Text style={styles.headerTitle}>
              Rack #
              {String(rackId).padStart(2, "0")}
            </Text>

            <Text style={styles.headerSubtitle}>
              Monitoreo en tiempo real
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  status.background,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    status.color,
                },
              ]}
            />

            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: status.color,
                },
              ]}
            >
              {status.label}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.temperatureCard,
            {
              borderColor:
                status.color,
            },
          ]}
        >
          <Text style={styles.temperatureLabel}>
            TEMPERATURA ACTUAL
          </Text>

          <View style={styles.temperatureMain}>
            <Thermometer
              size={32}
              color={status.color}
            />

            <Text style={styles.temperatureValue}>
              {temperature.toFixed(1)}
            </Text>

            <Text style={styles.temperatureUnit}>
              °C
            </Text>
          </View>

          <Text style={styles.updated}>
            Última lectura:{" "}
            {new Date(
              telemetry.recorded_at
            ).toLocaleTimeString()}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            icon={
              <Cpu
                size={20}
                color="#2563EB"
              />
            }
            label="CPU"
            value={`${Number(
              telemetry.cpu_load
            ).toFixed(1)}%`}
          />

          <MetricCard
            icon={
              <Droplets
                size={20}
                color="#38BDF8"
              />
            }
            label="HUMEDAD"
            value={`${Number(
              telemetry.humidity
            ).toFixed(1)}%`}
          />

          <MetricCard
            icon={
              <Wind
                size={20}
                color="#10B981"
              />
            }
            label="AIRFLOW"
            value={`${Number(
              telemetry.airflow
            ).toFixed(1)}%`}
          />

          <MetricCard
            icon={
              <Zap
                size={20}
                color="#F59E0B"
              />
            }
            label="POTENCIA"
            value={`${Number(
              telemetry.power_kw
            ).toFixed(1)} kW`}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Bot
            size={21}
            color="#10B981"
          />

          <Text style={styles.sectionTitle}>
            ANÁLISIS PREDICTIVO
          </Text>
        </View>

        <View style={styles.aiCard}>
          {predicting ? (
            <View style={styles.aiLoading}>
              <ActivityIndicator
                size="small"
                color="#10B981"
              />

              <Text style={styles.aiLoadingText}>
                Ejecutando XGBoost + LSTM...
              </Text>
            </View>
          ) : prediction ? (
            <>
              <View style={styles.modelRow}>
                <View style={styles.model}>
                  <Text style={styles.modelLabel}>
                    XGBOOST
                  </Text>

                  <Text style={styles.modelValue}>
                    {Number(
                      prediction.xgboost_prediction_c
                    ).toFixed(2)}
                    °C
                  </Text>
                </View>

                <View style={styles.model}>
                  <Text style={styles.modelLabel}>
                    LSTM
                  </Text>

                  <Text style={styles.modelValue}>
                    {Number(
                      prediction.lstm_prediction_c
                    ).toFixed(2)}
                    °C
                  </Text>
                </View>
              </View>

              <View style={styles.predictionBox}>
                <Text style={styles.predictionLabel}>
                  PREDICCIÓN EN{" "}
                  {prediction.prediction_horizon_minutes} MIN
                </Text>

                <Text style={styles.predictionValue}>
                  {Number(
                    prediction.prediction_temperature_c
                  ).toFixed(2)}
                  °C
                </Text>
              </View>

              <View style={styles.riskRow}>
                <View>
                  <Text style={styles.modelLabel}>
                    RIESGO TÉRMICO
                  </Text>

                  <Text
                    style={[
                      styles.riskValue,
                      {
                        color: riskColor,
                      },
                    ]}
                  >
                    {Number(risk).toFixed(0)}%
                  </Text>
                </View>

                <View
                  style={[
                    styles.riskIndicator,
                    {
                      backgroundColor:
                        riskColor,
                    },
                  ]}
                />
              </View>

              <View style={styles.recommendation}>
                <Text style={styles.recommendationTitle}>
                  RECOMENDACIÓN
                </Text>

                <Text
                  style={styles.recommendationText}
                >
                  {prediction.recommendation}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noPrediction}>
              No hay predicción disponible.
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Gauge
            size={20}
            color="#64748B"
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>
              Fuente de datos
            </Text>

            <Text style={styles.infoText}>
              PostgreSQL · IoT · MQTT
            </Text>
          </View>
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        {icon}
      </View>

      <Text style={styles.metricLabel}>
        {label}
      </Text>

      <Text style={styles.metricValue}>
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

  headerTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  temperatureCard: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
  },

  temperatureLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  temperatureMain: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 12,
  },

  temperatureValue: {
    color: "#F8FAFC",
    fontSize: 55,
    fontWeight: "800",
    marginLeft: 10,
  },

  temperatureUnit: {
    color: "#94A3B8",
    fontSize: 17,
    marginLeft: 4,
  },

  updated: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 8,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    marginTop: 12,
  },

  metricCard: {
    width: "48.5%",
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 15,
    padding: 14,
  },

  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#0A0F1C",
    alignItems: "center",
    justifyContent: "center",
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 12,
  },

  metricValue: {
    color: "#E2E8F0",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 25,
    marginBottom: 11,
  },

  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  aiCard: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    padding: 17,
  },

  aiLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },

  aiLoadingText: {
    color: "#94A3B8",
    fontSize: 12,
  },

  modelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  model: {
    width: "48%",
    backgroundColor: "#0A0F1C",
    borderRadius: 12,
    padding: 13,
  },

  modelLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  modelValue: {
    color: "#E2E8F0",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 6,
  },

  predictionBox: {
    backgroundColor: "#0A0F1C",
    borderRadius: 12,
    padding: 15,
    marginTop: 10,
    alignItems: "center",
  },

  predictionLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  predictionValue: {
    color: "#10B981",
    fontSize: 31,
    fontWeight: "800",
    marginTop: 5,
  },

  riskRow: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  riskValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },

  riskIndicator: {
    width: 65,
    height: 7,
    borderRadius: 5,
  },

  recommendation: {
    marginTop: 15,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#0A0F1C",
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },

  recommendationTitle: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  recommendationText: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 6,
  },

  noPrediction: {
    color: "#64748B",
    fontSize: 12,
    paddingVertical: 20,
    textAlign: "center",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
  },

  infoTitle: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },

  infoText: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 12,
  },

  errorTitle: {
    color: "#FCA5A5",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },

  errorText: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },

  retryButton: {
    backgroundColor: "#10B981",
    borderRadius: 10,
    paddingHorizontal: 25,
    paddingVertical: 12,
    marginTop: 18,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
});