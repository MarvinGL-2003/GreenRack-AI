import React, { useState } from "react";
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
  Activity,
  ArrowLeft,
  Brain,
  Cpu,
  Gauge,
  Thermometer,
  Wind,
  Zap,
} from "lucide-react-native";

import { predictRack, PredictionResponse } from "../../services/api";

export default function RackDetailScreen() {
  const { id } = useLocalSearchParams();
  const rackId = Number(id);

  const isRack12 = rackId === 12;
  const isRack6 = rackId === 6;
  const isRack18 = rackId === 18;

  const temperature = isRack12
    ? 27.9
    : isRack6
      ? 25.8
      : isRack18
        ? 26.3
        : 24.2;

  const cpu = isRack12
    ? 78
    : isRack6
      ? 61
      : isRack18
        ? 67
        : 45;

  const airflow = isRack12
    ? 55
    : isRack6
      ? 55
      : isRack18
        ? 58
        : 70;

  const power = isRack12 ? 245 : 220;

  const [prediction, setPrediction] =
    useState<PredictionResponse | null>(null);

  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);

    try {
      const result = await predictRack(rackId, {
        temperature,
        humidity: 48,
        cpu_load: cpu,
        airflow,
        power_kw: power,
      });

      setPrediction(result);
    } catch (error) {
      console.log("Error ejecutando predicción:", error);
    } finally {
      setLoading(false);
    }
  };

  const status =
    temperature >= 27
      ? { label: "CRÍTICO", color: "#EF4444" }
      : temperature >= 25.5
        ? { label: "ADVERTENCIA", color: "#F59E0B" }
        : { label: "NORMAL", color: "#22C55E" };

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

          <View>
            <Text style={styles.title}>
              Rack {String(rackId).padStart(2, "0")}
            </Text>

            <Text style={styles.subtitle}>
              Detalle y análisis térmico
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.mainTemperature,
            { borderColor: status.color },
          ]}
        >
          <View style={styles.temperatureIcon}>
            <Thermometer
              size={30}
              color={status.color}
            />
          </View>

          <Text style={styles.temperature}>
            {temperature.toFixed(1)}°C
          </Text>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${status.color}18`,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: status.color },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                { color: status.color },
              ]}
            >
              {status.label}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Telemetría actual
        </Text>

        <View style={styles.metricsGrid}>
          <Metric
            icon={<Activity size={20} color="#06B6D4" />}
            label="Temperatura"
            value={`${temperature} °C`}
          />

          <Metric
            icon={<Gauge size={20} color="#3B82F6" />}
            label="CPU Load"
            value={`${cpu}%`}
          />

          <Metric
            icon={<Wind size={20} color="#22C55E" />}
            label="Airflow"
            value={`${airflow}%`}
          />

          <Metric
            icon={<Zap size={20} color="#F59E0B" />}
            label="Potencia"
            value={`${power} kW`}
          />
        </View>

        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiIcon}>
              <Brain size={24} color="#22C55E" />
            </View>

            <View>
              <Text style={styles.aiTitle}>
                Análisis predictivo
              </Text>

              <Text style={styles.aiSubtitle}>
                XGBoost + LSTM
              </Text>
            </View>
          </View>

          <Text style={styles.aiDescription}>
            Analiza las condiciones actuales del rack y
            estima su temperatura para los próximos 15 minutos.
          </Text>

          <TouchableOpacity
            style={styles.analyzeButton}
            onPress={analyze}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Brain size={19} color="#FFFFFF" />

                <Text style={styles.analyzeText}>
                  Analizar con IA
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {prediction && (
          <>
            <Text style={styles.sectionTitle}>
              Resultado de IA
            </Text>

            <View style={styles.predictionCard}>
              <Text style={styles.predictionLabel}>
                PREDICCIÓN A {prediction.prediction_horizon_minutes} MIN
              </Text>

              <Text style={styles.predictionTemperature}>
                {prediction.prediction_temperature_c.toFixed(2)}°C
              </Text>

              <View style={styles.modelResult}>
                <View>
                  <Text style={styles.modelName}>
                    XGBoost
                  </Text>

                  <Text style={styles.modelValue}>
                    {prediction.xgboost_prediction_c.toFixed(2)}°C
                  </Text>
                </View>

                <Cpu size={21} color="#3B82F6" />

                <View style={{ marginLeft: "auto" }}>
                  <Text style={styles.modelName}>
                    LSTM
                  </Text>

                  <Text style={styles.modelValue}>
                    {prediction.lstm_prediction_c.toFixed(2)}°C
                  </Text>
                </View>

                <Brain
                  size={21}
                  color="#22C55E"
                />
              </View>

              <View style={styles.risk}>
                <Text style={styles.riskLabel}>
                  RIESGO TÉRMICO
                </Text>

                <Text style={styles.riskValue}>
                  {prediction.risk_percentage.toFixed(1)}%
                </Text>
              </View>

              <View style={styles.recommendation}>
                <Text style={styles.recommendationTitle}>
                  Recomendación
                </Text>

                <Text style={styles.recommendationText}>
                  {prediction.recommendation}
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricIcon}>{icon}</View>

      <Text style={styles.metricLabel}>{label}</Text>

      <Text style={styles.metricValue}>{value}</Text>
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
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingTop: 10,
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
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
  },

  mainTemperature: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },

  temperatureIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#172033",
    justifyContent: "center",
    alignItems: "center",
  },

  temperature: {
    color: "#F8FAFC",
    fontSize: 46,
    fontWeight: "800",
    marginTop: 10,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 8,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "900",
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 11,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  metric: {
    width: "48.5%",
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 15,
    padding: 14,
  },

  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#172033",
    justifyContent: "center",
    alignItems: "center",
  },

  metricLabel: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 10,
  },

  metricValue: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 3,
  },

  aiCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 18,
    padding: 17,
    marginTop: 23,
  },

  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  aiIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  aiTitle: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },

  aiSubtitle: {
    color: "#22C55E",
    fontSize: 11,
    marginTop: 3,
  },

  aiDescription: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 19,
    marginTop: 15,
  },

  analyzeButton: {
    height: 48,
    borderRadius: 13,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 15,
  },

  analyzeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  predictionCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 18,
    padding: 18,
  },

  predictionLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },

  predictionTemperature: {
    color: "#F8FAFC",
    fontSize: 36,
    fontWeight: "800",
    marginTop: 6,
  },

  modelResult: {
    backgroundColor: "#172033",
    borderRadius: 13,
    padding: 14,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  modelName: {
    color: "#94A3B8",
    fontSize: 10,
  },

  modelValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },

  risk: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  riskLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
  },

  riskValue: {
    color: "#22C55E",
    fontSize: 20,
    fontWeight: "800",
  },

  recommendation: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 12,
    padding: 13,
    marginTop: 14,
  },

  recommendationTitle: {
    color: "#22C55E",
    fontSize: 11,
    fontWeight: "800",
  },

  recommendationText: {
    color: "#CBD5E1",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
});