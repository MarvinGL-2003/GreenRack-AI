import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
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
  BrainCircuit,
  CheckCircle2,
  Cpu,
  RefreshCw,
  Server,
  ShieldAlert,
  Target,
  Zap,
} from "lucide-react-native";

import {
  getHealth,
  getMetrics,
  getTelemetry,
  predictRack,
  AIHealth,
  AIMetrics,
  PredictionResponse,
  Telemetry,
} from "../services/api";

const ACTIVE_RACKS = [1, 6, 12, 18];

export default function PredictiveScreen() {
  const [health, setHealth] =
    useState<AIHealth | null>(null);

  const [metrics, setMetrics] =
    useState<AIMetrics | null>(null);

  const [prediction, setPrediction] =
    useState<PredictionResponse | null>(null);

  const [selectedRack, setSelectedRack] =
    useState(12);

  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadPredictiveData =
    useCallback(async (manual = false) => {
      try {
        if (manual) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          healthData,
          metricsData,
          telemetryData,
        ] = await Promise.all([
          getHealth(),
          getMetrics(),
          getTelemetry(),
        ]);

        setHealth(healthData);
        setMetrics(metricsData);

        const rackTelemetry =
          telemetryData
            .filter(
              (item: Telemetry) =>
                Number(item.rack) ===
                selectedRack
            )
            .sort(
              (a, b) =>
                new Date(
                  b.recorded_at
                ).getTime() -
                new Date(
                  a.recorded_at
                ).getTime()
            );

        if (rackTelemetry.length > 0) {
          const current =
            rackTelemetry[0];

          setPredicting(true);

          try {
            const result =
              await predictRack(
                selectedRack,
                {
                  temperature:
                    Number(
                      current.temperature
                    ),
                  humidity:
                    Number(
                      current.humidity
                    ),
                  cpu_load:
                    Number(
                      current.cpu_load
                    ),
                  airflow:
                    Number(
                      current.airflow
                    ),
                  power_kw:
                    Number(
                      current.power_kw
                    ),
                }
              );

            setPrediction(result);
          } finally {
            setPredicting(false);
          }
        }
      } catch (err: any) {
        console.error(
          "Error cargando predictivo:",
          err
        );

        setError(
          err?.response?.data?.message ||
            "No se pudieron obtener los datos predictivos."
        );

        setPredicting(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [selectedRack]);

  useEffect(() => {
    loadPredictiveData();
  }, [loadPredictiveData]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadPredictiveData();
    }, 10000);

    return () => clearInterval(interval);
  }, [loadPredictiveData]);

  const risk =
    prediction?.risk_percentage ?? 0;

  const riskColor =
    risk >= 70
      ? "#EF4444"
      : risk >= 40
        ? "#F59E0B"
        : "#10B981";

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#10B981"
          />

          <Text style={styles.loadingText}>
            Cargando modelos de IA...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
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
              Predictivo
            </Text>

            <Text style={styles.subtitle}>
              Inteligencia artificial
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() =>
              loadPredictiveData(true)
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
            <Text style={styles.errorTitle}>
              Error de conexión
            </Text>

            <Text style={styles.errorText}>
              {error}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() =>
                loadPredictiveData(true)
              }
            >
              <Text style={styles.retryText}>
                REINTENTAR
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* AI STATUS */}
        <View style={styles.sectionHeader}>
          <BrainCircuit
            size={21}
            color="#10B981"
          />

          <Text style={styles.sectionTitle}>
            ESTADO DE LA IA
          </Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusLabel}>
                SERVICIO PREDICTIVO
              </Text>

              <Text style={styles.statusValue}>
                {health?.status === "ok" ||
                health?.status === "trained"
                  ? "OPERATIVO"
                  : "NO DISPONIBLE"}
              </Text>
            </View>

            <View
              style={[
                styles.onlineBadge,
                {
                  backgroundColor:
                    health?.status === "ok" ||
                    health?.status ===
                      "trained"
                      ? "rgba(16,185,129,0.12)"
                      : "rgba(239,68,68,0.12)",
                },
              ]}
            >
              <CheckCircle2
                size={17}
                color={
                  health?.status === "ok" ||
                  health?.status === "trained"
                    ? "#10B981"
                    : "#EF4444"
                }
              />

              <Text
                style={[
                  styles.onlineText,
                  {
                    color:
                      health?.status ===
                        "ok" ||
                      health?.status ===
                        "trained"
                        ? "#10B981"
                        : "#EF4444",
                  },
                ]}
              >
                {health?.status === "ok" ||
                health?.status === "trained"
                  ? "ONLINE"
                  : "OFFLINE"}
              </Text>
            </View>
          </View>

          <View style={styles.modelsRow}>
            <ModelStatus
              name="XGBoost"
              active={
                health?.models?.xgboost ??
                false
              }
            />

            <ModelStatus
              name="LSTM"
              active={
                health?.models?.lstm ??
                false
              }
            />
          </View>
        </View>

        {/* RACK SELECTOR */}
        <View style={styles.sectionHeader}>
          <Server
            size={20}
            color="#2563EB"
          />

          <Text style={styles.sectionTitle}>
            RACK A ANALIZAR
          </Text>
        </View>

        <View style={styles.rackSelector}>
          {ACTIVE_RACKS.map((rack) => {
            const active =
              selectedRack === rack;

            return (
              <TouchableOpacity
                key={rack}
                style={[
                  styles.rackButton,
                  active &&
                    styles.rackButtonActive,
                ]}
                onPress={() =>
                  setSelectedRack(rack)
                }
              >
                <Text
                  style={[
                    styles.rackButtonText,
                    active &&
                      styles.rackButtonTextActive,
                  ]}
                >
                  #{String(rack).padStart(
                    2,
                    "0"
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* PREDICTION */}
        <View style={styles.sectionHeader}>
          <Target
            size={20}
            color="#10B981"
          />

          <Text style={styles.sectionTitle}>
            PREDICCIÓN TÉRMICA
          </Text>
        </View>

        <View style={styles.predictionCard}>
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
              <Text style={styles.predictionLabel}>
                RACK #
                {String(selectedRack).padStart(
                  2,
                  "0"
                )}
              </Text>

              <View
                style={
                  styles.predictionMain
                }
              >
                <Text
                  style={styles.predictionValue}
                >
                  {Number(
                    prediction.prediction_temperature_c
                  ).toFixed(2)}
                  °C
                </Text>

                <Text
                  style={
                    styles.predictionTime
                  }
                >
                  en{" "}
                  {
                    prediction.prediction_horizon_minutes
                  }{" "}
                  minutos
                </Text>
              </View>

              <View style={styles.modelsPrediction}>
                <PredictionModel
                  name="XGBOOST"
                  value={
                    prediction.xgboost_prediction_c
                  }
                />

                <PredictionModel
                  name="LSTM"
                  value={
                    prediction.lstm_prediction_c
                  }
                />
              </View>

              <View style={styles.riskContainer}>
                <View>
                  <Text
                    style={styles.riskLabel}
                  >
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
                  style={styles.riskBarBackground}
                >
                  <View
                    style={[
                      styles.riskBar,
                      {
                        width: `${Math.min(
                          risk,
                          100
                        )}%`,
                        backgroundColor:
                          riskColor,
                      },
                    ]}
                  />
                </View>
              </View>

              <View
                style={styles.recommendation}
              >
                <Text
                  style={
                    styles.recommendationTitle
                  }
                >
                  RECOMENDACIÓN DE IA
                </Text>

                <Text
                  style={
                    styles.recommendationText
                  }
                >
                  {
                    prediction.recommendation
                  }
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noData}>
              No hay predicción disponible.
            </Text>
          )}
        </View>

        {/* MODEL METRICS */}
        <View style={styles.sectionHeader}>
          <Cpu
            size={20}
            color="#F59E0B"
          />

          <Text style={styles.sectionTitle}>
            MÉTRICAS DE LOS MODELOS
          </Text>
        </View>

        <View style={styles.metricsCard}>
          <MetricRow
            label="Muestras de entrenamiento"
            value={String(
              metrics?.metrics
                ?.training_samples ?? "-"
            )}
          />

          <MetricRow
            label="MAE XGBoost"
            value={
              metrics
                ? `${metrics.metrics.xgboost.mae_c.toFixed(
                    4
                  )} °C`
                : "-"
            }
          />

          <MetricRow
            label="RMSE XGBoost"
            value={
              metrics
                ? `${metrics.metrics.xgboost.rmse_c.toFixed(
                    4
                  )} °C`
                : "-"
            }
          />

          <MetricRow
            label="MAE LSTM"
            value={
              metrics
                ? `${metrics.metrics.lstm.mae_c.toFixed(
                    4
                  )} °C`
                : "-"
            }
          />

          <MetricRow
            label="RMSE LSTM"
            value={
              metrics
                ? `${metrics.metrics.lstm.rmse_c.toFixed(
                    4
                  )} °C`
                : "-"
            }
          />

          <MetricRow
            label="Secuencia LSTM"
            value={
              metrics
                ? `${metrics.metrics.sequence_length} pasos`
                : "-"
            }
          />

          <MetricRow
            label="Horizonte"
            value={
              metrics
                ? `${metrics.metrics.prediction_horizon_minutes} minutos`
                : "-"
            }
          />
        </View>

        {/* INFO */}
        <View style={styles.infoCard}>
          <Zap
            size={20}
            color="#64748B"
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>
              Pipeline de IA
            </Text>

            <Text style={styles.infoText}>
              PostgreSQL → FastAPI →
              XGBoost + LSTM → Predicción
            </Text>
          </View>
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>
    </SafeAreaView>
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
    <View style={styles.modelStatus}>
      <View
        style={[
          styles.modelIcon,
          {
            backgroundColor: active
              ? "rgba(16,185,129,0.10)"
              : "rgba(239,68,68,0.10)",
          },
        ]}
      >
        {active ? (
          <CheckCircle2
            size={19}
            color="#10B981"
          />
        ) : (
          <ShieldAlert
            size={19}
            color="#EF4444"
          />
        )}
      </View>

      <View>
        <Text style={styles.modelName}>
          {name}
        </Text>

        <Text
          style={[
            styles.modelState,
            {
              color: active
                ? "#10B981"
                : "#EF4444",
            },
          ]}
        >
          {active ? "ACTIVO" : "INACTIVO"}
        </Text>
      </View>
    </View>
  );
}

function PredictionModel({
  name,
  value,
}: {
  name: string;
  value: number;
}) {
  return (
    <View style={styles.modelPrediction}>
      <Text style={styles.modelPredictionName}>
        {name}
      </Text>

      <Text
        style={styles.modelPredictionValue}
      >
        {Number(value).toFixed(2)}°C
      </Text>
    </View>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricRowLabel}>
        {label}
      </Text>

      <Text style={styles.metricRowValue}>
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

  statusCard: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    padding: 17,
  },

  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  statusValue: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 5,
  },

  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  onlineText: {
    fontSize: 9,
    fontWeight: "900",
  },

  modelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 17,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#243049",
  },

  modelStatus: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  modelIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  modelName: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },

  modelState: {
    fontSize: 9,
    fontWeight: "900",
    marginTop: 3,
  },

  rackSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  rackButton: {
    flex: 1,
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 11,
    paddingVertical: 12,
    alignItems: "center",
  },

  rackButtonActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },

  rackButtonText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },

  rackButtonTextActive: {
    color: "#FFFFFF",
  },

  predictionCard: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    padding: 17,
  },

  predictionLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  predictionMain: {
    alignItems: "center",
    marginTop: 10,
  },

  predictionValue: {
    color: "#10B981",
    fontSize: 39,
    fontWeight: "800",
  },

  predictionTime: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  modelsPrediction: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 17,
    gap: 10,
  },

  modelPrediction: {
    flex: 1,
    backgroundColor: "#0A0F1C",
    borderRadius: 12,
    padding: 13,
  },

  modelPredictionName: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  modelPredictionValue: {
    color: "#E2E8F0",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 5,
  },

  riskContainer: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#243049",
  },

  riskLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  riskValue: {
    fontSize: 25,
    fontWeight: "800",
    marginTop: 4,
  },

  riskBarBackground: {
    height: 7,
    backgroundColor: "#243049",
    borderRadius: 5,
    overflow: "hidden",
    marginTop: 9,
  },

  riskBar: {
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

  metricsCard: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    paddingHorizontal: 16,
  },

  metricRow: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#243049",
  },

  metricRowLabel: {
    color: "#94A3B8",
    fontSize: 11,
  },

  metricRowValue: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "800",
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
    lineHeight: 16,
  },

  aiLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 30,
  },

  aiLoadingText: {
    color: "#94A3B8",
    fontSize: 12,
  },

  noData: {
    color: "#64748B",
    textAlign: "center",
    paddingVertical: 30,
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