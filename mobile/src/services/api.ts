import axios from "axios";

export const API_URL = "http://192.168.0.13:4000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

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
  rack: string;
  prediction_horizon_minutes: number;
  prediction_temperature_c: number;
  xgboost_prediction_c: number;
  lstm_prediction_c: number;
  risk_percentage: number;
  recommendation: string;
  models: string[];
}

export const getHealth = async (): Promise<AIHealth> => {
  const response = await api.get("/api/ai/health");
  return response.data;
};

export const getMetrics = async (): Promise<AIMetrics> => {
  const response = await api.get("/api/ai/metrics");
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