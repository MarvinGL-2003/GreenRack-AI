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
import { router } from "expo-router";
import { ArrowLeft, Brain, Cpu, Server } from "lucide-react-native";

import { predictRack, PredictionResponse } from "../services/api";

export default function PredictiveScreen() {
  const [selectedRack, setSelectedRack] = useState(12);
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<PredictionResponse | null>(null);

  const analyze = async () => {
    setLoading(true);

    const temperature =
      selectedRack === 12
        ? 27.9
        : selectedRack === 6
          ? 25.8
          : selectedRack === 18
            ? 26.3
            : 24.2;

    const cpu =
      selectedRack === 12
        ? 78
        : selectedRack === 6
          ? 61
          : selectedRack === 18
            ? 67
            : 45;

    const airflow =
      selectedRack === 12
        ? 55
        : selectedRack === 6
          ? 55
          : selectedRack === 18
            ? 58
            : 70;

    try {
      const response = await predictRack(selectedRack, {
        temperature,
        humidity: 48,
        cpu_load: cpu,
        airflow,
        power_kw: selectedRack === 12 ? 245 : 220,
      });

      setResult(response);
    } catch (error) {
      console.log("Error en IA:", error);
    } finally {
      setLoading(false);
    }
  };

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
              IA Predictiva
            </Text>

            <Text style={styles.subtitle}>
              XGBoost + LSTM
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.brainCircle}>
            <Brain size={36} color="#22C55E" />
          </View>

          <Text style={styles.heroTitle}>
            Análisis térmico inteligente
          </Text>

          <Text style={styles.heroText}>
            Selecciona un rack y ejecuta el modelo real
            de GreenRack AI.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          Seleccionar rack
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rackSelector}
        >
          {[1, 6, 12, 18].map((rack) => (
            <TouchableOpacity
              key={rack}
              onPress={() => {
                setSelectedRack(rack);
                setResult(null);
              }}
              style={[
                styles.rackButton,
                selectedRack === rack &&
                  styles.rackButtonSelected,
              ]}
            >
              <Server
                size={17}
                color={
                  selectedRack === rack
                    ? "#FFFFFF"
                    : "#94A3B8"
                }
              />

              <Text
                style={[
                  styles.rackButtonText,
                  selectedRack === rack &&
                    styles.rackButtonTextSelected,
                ]}
              >
                Rack {rack}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.analyzeButton}
          onPress={analyze}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Brain size={20} color="#FFFFFF" />

              <Text style={styles.analyzeText}>
                Ejecutar predicción
              </Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>
              RESULTADO · RACK {result.rack}
            </Text>

            <Text style={styles.resultTemperature}>
              {result.prediction_temperature_c.toFixed(2)}°C
            </Text>

            <Text style={styles.resultSubtitle}>
              Temperatura estimada en{" "}
              {result.prediction_horizon_minutes} minutos
            </Text>

            <View style={styles.models}>
              <View style={styles.model}>
                <Cpu size={20} color="#3B82F6" />

                <Text style={styles.modelName}>
                  XGBoost
                </Text>

                <Text style={styles.modelValue}>
                  {result.xgboost_prediction_c.toFixed(2)}°C
                </Text>
              </View>

              <View style={styles.model}>
                <Brain size={20} color="#22C55E" />

                <Text style={styles.modelName}>
                  LSTM
                </Text>

                <Text style={styles.modelValue}>
                  {result.lstm_prediction_c.toFixed(2)}°C
                </Text>
              </View>
            </View>

            <View style={styles.riskBox}>
              <Text style={styles.riskTitle}>
                RIESGO
              </Text>

              <Text style={styles.riskValue}>
                {result.risk_percentage.toFixed(1)}%
              </Text>
            </View>

            <View style={styles.recommendation}>
              <Text style={styles.recommendationTitle}>
                Recomendación del sistema
              </Text>

              <Text style={styles.recommendationText}>
                {result.recommendation}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
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
    color: "#22C55E",
    fontSize: 11,
    marginTop: 3,
  },

  hero: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },

  brainCircle: {
    width: 70,
    height: 70,
    borderRadius: 23,
    backgroundColor: "rgba(34,197,94,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  heroTitle: {
    color: "#F8FAFC",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 14,
  },

  heroText: {
    color: "#94A3B8",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 11,
  },

  rackSelector: {
    gap: 9,
  },

  rackButton: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  rackButtonSelected: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },

  rackButtonText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
  },

  rackButtonTextSelected: {
    color: "#FFFFFF",
  },

  analyzeButton: {
    backgroundColor: "#22C55E",
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  analyzeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  resultCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 18,
    padding: 18,
    marginTop: 22,
  },

  resultLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "800",
  },

  resultTemperature: {
    color: "#F8FAFC",
    fontSize: 40,
    fontWeight: "800",
    marginTop: 5,
  },

  resultSubtitle: {
    color: "#94A3B8",
    fontSize: 11,
  },

  models: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  model: {
    flex: 1,
    backgroundColor: "#172033",
    borderRadius: 13,
    padding: 13,
  },

  modelName: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 7,
  },

  modelValue: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 3,
  },

  riskBox: {
    marginTop: 13,
    padding: 14,
    borderRadius: 13,
    backgroundColor: "#172033",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  riskTitle: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "800",
  },

  riskValue: {
    color: "#22C55E",
    fontSize: 21,
    fontWeight: "800",
  },

  recommendation: {
    backgroundColor: "rgba(34,197,94,0.08)",
    padding: 14,
    borderRadius: 13,
    marginTop: 13,
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