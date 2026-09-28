import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  "http://192.168.0.13:4000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator";
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: AuthUser;
}

export interface Telemetry {
  id: number;
  device: string;
  rack: number;
  temperature: number;
  humidity: number;
  cpu_load: number;
  airflow: number;
  power_kw: number;
  recorded_at: string;
}

export interface AIHealth {
  status: string;
  models: {
    xgboost: boolean;
    lstm: boolean;
  };
  trained_at?: string;
}

export interface AIMetrics {
  status: string;
  models: string[];
  metrics: {
    xgboost: {
      mae_c: number;
      rmse_c: number;
      test_samples: number;
    };
    lstm: {
      mae_c: number;
      rmse_c: number;
      test_samples: number;
    };
    training_samples: number;
    features: string[];
    prediction_horizon_minutes: number;
    sequence_length: number;
  };
  trained_at?: string;
}

export interface PredictionResponse {
  rack: string | number;
  prediction_horizon_minutes: number;
  prediction_temperature_c: number;
  xgboost_prediction_c: number;
  lstm_prediction_c: number;
  risk_percentage: number;
  recommendation: string;
  models: string[];
};

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(
    "greenrack_token",
    token
  );
}

export async function getToken() {
  return SecureStore.getItemAsync(
    "greenrack_token"
  );
}

export async function removeToken() {
  await SecureStore.deleteItemAsync(
    "greenrack_token"
  );
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const response = await api.post(
    "/api/auth/login",
    {
      email,
      password,
    }
  );

  return response.data;
};

export const getMe = async () => {
  const response = await api.get(
    "/api/auth/me"
  );

  return response.data;
};

export const getTelemetry = async (): Promise<
  Telemetry[]
> => {
  const response = await api.get(
    "/api/telemetry"
  );

  const data = response.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.telemetry)) {
    return data.telemetry;
  }

  return [];
};

export const getHealth =
  async (): Promise<AIHealth> => {
    const response = await api.get(
      "/api/ai/health"
    );

    return response.data;
  };

export const getMetrics =
  async (): Promise<AIMetrics> => {
    const response = await api.get(
      "/api/ai/metrics"
    );

    return response.data;
  };

export const predictRack = async (
  rackId: number,
  telemetry: {
    temperature: number;
    humidity: number;
    cpu_load: number;
    airflow: number;
    power_kw: number;
  }
): Promise<PredictionResponse> => {
  const response = await api.post(
    `/api/ai/predict/${rackId}`,
    telemetry
  );

  return response.data;
};

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    if (
      error.response?.status === 401
    ) {
      await removeToken();
    }

    return Promise.reject(error);
  }
);