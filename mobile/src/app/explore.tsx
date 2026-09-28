
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
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
  LogOut,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react-native";

import {
  getMe,
  removeToken,
} from "../services/api";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator";
  active?: boolean;
  created_at?: string;
}

export default function ProfileScreen() {
  const [user, setUser] =
    useState<UserData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const loadProfile =
    useCallback(async () => {
      try {
        setLoading(true);

        const response = await getMe();

        if (response.success) {
          setUser(response.user);
        }
      } catch (error) {
        console.error(
          "Error cargando perfil:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Deseas cerrar tu sesión actual?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: performLogout,
        },
      ]
    );
  };

  const performLogout = async () => {
    try {
      setLoggingOut(true);

      await removeToken();

      router.replace("/login");
    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );

      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#10B981"
          />

          <Text style={styles.loadingText}>
            Cargando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const roleLabel =
    user?.role === "admin"
      ? "Administrador"
      : "Operador";

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
              Perfil
            </Text>

            <Text style={styles.subtitle}>
              Información de la cuenta
            </Text>
          </View>
        </View>

        {/* USER CARD */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User
              size={36}
              color="#10B981"
            />
          </View>

          <Text style={styles.name}>
            {user?.name ||
              "Usuario GreenRack"}
          </Text>

          <Text style={styles.role}>
            {roleLabel}
          </Text>
        </View>

        {/* ACCOUNT INFORMATION */}
        <View style={styles.sectionHeader}>
          <ShieldCheck
            size={20}
            color="#10B981"
          />

          <Text style={styles.sectionTitle}>
            INFORMACIÓN DE CUENTA
          </Text>
        </View>

        <View style={styles.infoCard}>
          <InfoRow
            icon={
              <User
                size={18}
                color="#64748B"
              />
            }
            label="Nombre"
            value={
              user?.name ||
              "No disponible"
            }
          />

          <InfoRow
            icon={
              <Mail
                size={18}
                color="#64748B"
              />
            }
            label="Correo electrónico"
            value={
              user?.email ||
              "No disponible"
            }
          />

          <InfoRow
            icon={
              <ShieldCheck
                size={18}
                color="#64748B"
              />
            }
            label="Rol"
            value={roleLabel}
          />

          <InfoRow
            icon={
              <ShieldCheck
                size={18}
                color="#64748B"
              />
            }
            label="Estado"
            value={
              user?.active === false
                ? "Inactivo"
                : "Activo"
            }
            last
          />
        </View>

        {/* SESSION */}
        <View style={styles.sectionHeader}>
          <LogOut
            size={20}
            color="#F59E0B"
          />

          <Text style={styles.sectionTitle}>
            SESIÓN
          </Text>
        </View>

        <View style={styles.sessionCard}>
          <Text style={styles.sessionTitle}>
            Sesión actual
          </Text>

          <Text style={styles.sessionText}>
            Tu sesión está protegida mediante
            autenticación JWT.
          </Text>

          <TouchableOpacity
            style={[
              styles.logoutButton,
              loggingOut &&
                styles.logoutDisabled,
            ]}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <LogOut
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.logoutText}
                >
                  CERRAR SESIÓN
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            GREENRACK AI
          </Text>

          <Text style={styles.footerText}>
            IA • IoT • MONITOREO
          </Text>
        </View>

        <View style={{ height: 35 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && styles.infoRowBorder,
      ]}
    >
      <View style={styles.infoIcon}>
        {icon}
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
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
    paddingBottom: 22,
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
    fontSize: 25,
    fontWeight: "800",
  },

  subtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 3,
  },

  profileCard: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#0A0F1C",
    borderWidth: 1,
    borderColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },

  name: {
    color: "#F8FAFC",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },

  role: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 24,
    marginBottom: 11,
  },

  sectionTitle: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  infoCard: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    paddingHorizontal: 15,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#243049",
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#0A0F1C",
    alignItems: "center",
    justifyContent: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
  },

  infoValue: {
    color: "#E2E8F0",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },

  sessionCard: {
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 17,
    padding: 17,
  },

  sessionTitle: {
    color: "#E2E8F0",
    fontSize: 14,
    fontWeight: "700",
  },

  sessionText: {
    color: "#64748B",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  logoutButton: {
    height: 49,
    backgroundColor: "#EF4444",
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 17,
  },

  logoutDisabled: {
    opacity: 0.6,
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  footer: {
    alignItems: "center",
    marginTop: 28,
  },

  footerTitle: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  footerText: {
    color: "#334155",
    fontSize: 9,
    marginTop: 5,
    letterSpacing: 1,
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

