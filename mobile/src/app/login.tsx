import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react-native";
import { router } from "expo-router";

import { login, saveToken } from "../services/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const response = await login(
        email.trim(),
        password
      );

      if (!response.success || !response.token) {
        setError(response.message || "No se pudo iniciar sesión.");
        return;
      }

      await saveToken(response.token);

      router.replace("/");
    } catch (err: any) {
      console.error("Error de login:", err);

      setError(
        err?.response?.data?.message ||
          "No se pudo conectar con el servidor."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <ShieldCheck size={34} color="#10B981" />
          </View>

          <Text style={styles.title}>GREENRACK AI</Text>
          <Text style={styles.subtitle}>
            Centro de control inteligente
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>
            Iniciar sesión
          </Text>

          <Text style={styles.description}>
            Accede al monitoreo de tu infraestructura.
          </Text>

          <Text style={styles.label}>
            CORREO ELECTRÓNICO
          </Text>

          <View style={styles.inputContainer}>
            <Mail size={19} color="#64748B" />

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#64748B"
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>
            CONTRASEÑA
          </Text>

          <View style={styles.inputContainer}>
            <LockKeyhole size={19} color="#64748B" />

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              secureTextEntry={!showPassword}
              editable={!loading}
            />

            <Pressable
              onPress={() =>
                setShowPassword(!showPassword)
              }
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff size={20} color="#64748B" />
              ) : (
                <Eye size={20} color="#64748B" />
              )}
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {error}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.button,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                INGRESAR
              </Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footer}>
          IA • IoT • MONITOREO
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1C",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#131B2E",
    borderWidth: 1,
    borderColor: "#243049",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: {
    color: "#E2E8F0",
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  subtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 7,
  },

  card: {
    backgroundColor: "#131B2E",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#243049",
    padding: 22,
  },

  heading: {
    color: "#E2E8F0",
    fontSize: 22,
    fontWeight: "700",
  },

  description: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 24,
  },

  label: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
  },

  inputContainer: {
    height: 52,
    backgroundColor: "#0A0F1C",
    borderWidth: 1,
    borderColor: "#243049",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    color: "#E2E8F0",
    fontSize: 14,
    marginLeft: 10,
  },

  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.10)",
    borderWidth: 1,
    borderColor: "#7F1D1D",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },

  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
  },

  button: {
    height: 52,
    backgroundColor: "#10B981",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  footer: {
    color: "#475569",
    fontSize: 11,
    textAlign: "center",
    marginTop: 28,
    letterSpacing: 1,
  },
});