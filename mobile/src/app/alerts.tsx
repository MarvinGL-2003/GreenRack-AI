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
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react-native";

const alerts = [
  {
    rack: 12,
    temperature: 27.9,
    type: "Crítico",
    color: "#EF4444",
    description:
      "Temperatura superior al umbral establecido.",
  },
  {
    rack: 18,
    temperature: 26.3,
    type: "Advertencia",
    color: "#F59E0B",
    description:
      "Incremento térmico requiere monitoreo.",
  },
  {
    rack: 6,
    temperature: 25.8,
    type: "Advertencia",
    color: "#F59E0B",
    description:
      "Flujo de aire por debajo del nivel óptimo.",
  },
];

export default function AlertsScreen() {
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
            <Text style={styles.title}>Alertas</Text>
            <Text style={styles.subtitle}>
              Eventos que requieren atención
            </Text>
          </View>

          <AlertTriangle size={24} color="#F59E0B" />
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.number,
                { color: "#EF4444" },
              ]}
            >
              1
            </Text>

            <Text style={styles.label}>CRÍTICA</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.number,
                { color: "#F59E0B" },
              ]}
            >
              2
            </Text>

            <Text style={styles.label}>
              ADVERTENCIAS
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryItem}>
            <Text
              style={[
                styles.number,
                { color: "#22C55E" },
              ]}
            >
              21
            </Text>

            <Text style={styles.label}>NORMALES</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Alertas activas
        </Text>

        {alerts.map((alert) => (
        <TouchableOpacity
  key={alert.rack}
  style={styles.alertCard}
  onPress={() =>
    router.push({
      pathname: "/rack/id",
      params: { id: String(alert.rack) },
    })
  }
>
            <View
              style={[
                styles.icon,
                {
                  backgroundColor: `${alert.color}18`,
                },
              ]}
            >
              <AlertTriangle
                size={21}
                color={alert.color}
              />
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text style={styles.rack}>
                  Rack {alert.rack}
                </Text>

                <Text
                  style={[
                    styles.type,
                    { color: alert.color },
                  ]}
                >
                  {alert.type}
                </Text>
              </View>

              <Text style={styles.temperature}>
                {alert.temperature.toFixed(1)}°C
              </Text>

              <Text style={styles.description}>
                {alert.description}
              </Text>
            </View>

            <ArrowRight
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>
        ))}

        <View style={styles.okCard}>
          <CheckCircle2
            size={22}
            color="#22C55E"
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.okTitle}>
              Sistema estable
            </Text>

            <Text style={styles.okText}>
              21 racks operan dentro de los parámetros
              establecidos.
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

  summary: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 16,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  summaryItem: {
    alignItems: "center",
    flex: 1,
  },

  number: {
    fontSize: 25,
    fontWeight: "800",
  },

  label: {
    color: "#64748B",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 3,
  },

  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#243047",
  },

  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 24,
    marginBottom: 12,
  },

  alertCard: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#243047",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },

  icon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  rack: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },

  type: {
    fontSize: 9,
    fontWeight: "900",
  },

  temperature: {
    color: "#F8FAFC",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 4,
  },

  description: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  okCard: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginTop: 12,
  },

  okTitle: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "800",
  },

  okText: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 3,
  },
});