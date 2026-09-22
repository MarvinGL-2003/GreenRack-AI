from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

import numpy as np

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.preprocessing import StandardScaler

from xgboost import XGBRegressor

from tensorflow.keras import Sequential
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.layers import Dense, LSTM, Input
from tensorflow.keras.optimizers import Adam


app = FastAPI(
    title="GreenRack AI Predictive Service",
    version="1.0.0"
)


# ============================================================
# CONFIGURACIÓN
# ============================================================

FEATURES = [
    "temperature",
    "humidity",
    "cpu_load",
    "airflow",
    "power_kw"
]

SEQUENCE_LENGTH = 12
PREDICTION_HORIZON = 15

xgb_model: Optional[XGBRegressor] = None
lstm_model: Optional[Sequential] = None

feature_scaler: Optional[StandardScaler] = None
target_scaler: Optional[StandardScaler] = None

model_metrics = {}
trained_at = None


# ============================================================
# ESQUEMA DE ENTRADA
# ============================================================

class PredictionRequest(BaseModel):

    temperature: float
    humidity: float = 45.0
    cpu_load: float = 60.0
    airflow: float = 70.0
    power_kw: float = 220.0

    # Historial para el LSTM.
    #
    # Cada elemento debe tener:
    # [temperature, humidity, cpu_load, airflow, power_kw]
    history: Optional[list[list[float]]] = None


# ============================================================
# GENERACIÓN DEL DATASET
# ============================================================

def generate_dataset(samples=2000, seed=42):

    """
    Genera datos sintéticos para validar el pipeline de IA.

    IMPORTANTE:
    Estos datos son únicamente para la primera validación
    técnica del sistema.

    Posteriormente deben sustituirse por telemetría histórica
    real procedente del sistema IoT.
    """

    rng = np.random.default_rng(seed)

    time = np.arange(samples)

    # --------------------------------------------------------
    # CARGA DE CPU
    # --------------------------------------------------------

    cpu = np.clip(
        55
        + 18 * np.sin(time / 55)
        + rng.normal(0, 6, samples),
        15,
        95
    )

    # --------------------------------------------------------
    # HUMEDAD
    # --------------------------------------------------------

    humidity = np.clip(
        45
        + 6 * np.sin(time / 80)
        + rng.normal(0, 1.8, samples),
        25,
        75
    )

    # --------------------------------------------------------
    # FLUJO DE AIRE
    # --------------------------------------------------------

    airflow = np.clip(
        72
        - 0.18 * (cpu - 55)
        + rng.normal(0, 2.5, samples),
        40,
        95
    )

    # --------------------------------------------------------
    # CONSUMO ELÉCTRICO
    # --------------------------------------------------------

    power = np.clip(
        175
        + 0.85 * cpu
        + rng.normal(0, 4, samples),
        120,
        270
    )

    # --------------------------------------------------------
    # TEMPERATURA
    # --------------------------------------------------------

    temperature = np.zeros(samples)

    temperature[0] = 23.0

    for i in range(1, samples):

        # Temperatura térmica esperada según las condiciones
        # actuales del rack.
        #
        # Mayor CPU/potencia -> mayor temperatura.
        # Mayor flujo de aire -> menor temperatura.
        # Humedad tiene un efecto pequeño.

        target_temperature = (
            18.0
            + 0.055 * cpu[i]
            + 0.028 * power[i]
            - 0.040 * airflow[i]
            + 0.015 * (humidity[i] - 45)
        )

        # La temperatura se aproxima gradualmente al equilibrio
        # en lugar de acumular indefinidamente calor.

        temperature[i] = (
            temperature[i - 1]
            + 0.12
            * (
                target_temperature
                - temperature[i - 1]
            )
            + rng.normal(0, 0.045)
        )

        temperature[i] = np.clip(
            temperature[i],
            19,
            34
        )

    # --------------------------------------------------------
    # MATRIZ DE VARIABLES
    # --------------------------------------------------------

    X = np.column_stack(
        [
            temperature,
            humidity,
            cpu,
            airflow,
            power
        ]
    )

    # Temperatura 15 minutos hacia el futuro.

    y = np.roll(
        temperature,
        -PREDICTION_HORIZON
    )

    valid = np.arange(
        0,
        samples - PREDICTION_HORIZON
    )

    return X[valid], y[valid]


# ============================================================
# ENTRENAMIENTO XGBOOST
# ============================================================

def train_xgboost(X, y):

    global xgb_model

    split = int(len(X) * 0.8)

    X_train = X[:split]
    X_test = X[split:]

    y_train = y[:split]
    y_test = y[split:]

    xgb_model = XGBRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=42
    )

    xgb_model.fit(
        X_train,
        y_train
    )

    prediction = xgb_model.predict(
        X_test
    )

    mae = mean_absolute_error(
        y_test,
        prediction
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            prediction
        )
    )

    return {
        "mae_c": float(mae),
        "rmse_c": float(rmse),
        "test_samples": len(y_test)
    }


# ============================================================
# PREPARAR SECUENCIAS PARA LSTM
# ============================================================

def create_sequences(X, y):

    sequences = []
    targets = []

    for i in range(
        SEQUENCE_LENGTH,
        len(X)
    ):

        sequences.append(
            X[
                i - SEQUENCE_LENGTH:i
            ]
        )

        targets.append(
            y[i]
        )

    return (
        np.asarray(
            sequences,
            dtype=np.float32
        ),
        np.asarray(
            targets,
            dtype=np.float32
        )
    )


# ============================================================
# ENTRENAMIENTO LSTM
# ============================================================

def train_lstm(X, y):

    global lstm_model
    global feature_scaler
    global target_scaler

    # --------------------------------------------------------
    # CREAR SECUENCIAS
    # --------------------------------------------------------

    sequences, targets = create_sequences(
        X,
        y
    )

    # --------------------------------------------------------
    # DIVISIÓN TEMPORAL
    # --------------------------------------------------------

    split = int(
        len(sequences) * 0.8
    )

    X_train = sequences[:split]
    X_test = sequences[split:]

    y_train = targets[:split]
    y_test = targets[split:]

    # --------------------------------------------------------
    # NORMALIZACIÓN DE VARIABLES
    # --------------------------------------------------------

    feature_scaler = StandardScaler()

    feature_scaler.fit(
        X_train.reshape(
            -1,
            len(FEATURES)
        )
    )

    X_train_scaled = feature_scaler.transform(
        X_train.reshape(
            -1,
            len(FEATURES)
        )
    ).reshape(
        X_train.shape
    )

    X_test_scaled = feature_scaler.transform(
        X_test.reshape(
            -1,
            len(FEATURES)
        )
    ).reshape(
        X_test.shape
    )

    # --------------------------------------------------------
    # NORMALIZACIÓN DEL OBJETIVO
    # --------------------------------------------------------

    target_scaler = StandardScaler()

    target_scaler.fit(
        y_train.reshape(-1, 1)
    )

    y_train_scaled = target_scaler.transform(
        y_train.reshape(-1, 1)
    ).reshape(-1)

    y_test_scaled = target_scaler.transform(
        y_test.reshape(-1, 1)
    ).reshape(-1)

    # --------------------------------------------------------
    # ARQUITECTURA LSTM
    # --------------------------------------------------------

    lstm_model = Sequential(
        [
            Input(
                shape=(
                    SEQUENCE_LENGTH,
                    len(FEATURES)
                )
            ),

            LSTM(
                64,
                return_sequences=False
            ),

            Dense(
                32,
                activation="relu"
            ),

            Dense(
                16,
                activation="relu"
            ),

            Dense(1)
        ]
    )

    lstm_model.compile(
        optimizer=Adam(
            learning_rate=0.001
        ),
        loss="mse"
    )

    # --------------------------------------------------------
    # EARLY STOPPING
    # --------------------------------------------------------

    early_stopping = EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True
    )

    # --------------------------------------------------------
    # ENTRENAMIENTO
    # --------------------------------------------------------

    lstm_model.fit(
        X_train_scaled,
        y_train_scaled,
        validation_split=0.15,
        epochs=50,
        batch_size=32,
        callbacks=[
            early_stopping
        ],
        verbose=0
    )

    # --------------------------------------------------------
    # PREDICCIÓN
    # --------------------------------------------------------

    prediction_scaled = lstm_model.predict(
        X_test_scaled,
        verbose=0
    ).reshape(-1, 1)

    # Regresamos las predicciones a grados Celsius.

    prediction = target_scaler.inverse_transform(
        prediction_scaled
    ).reshape(-1)

    # --------------------------------------------------------
    # MÉTRICAS EN °C
    # --------------------------------------------------------

    mae = mean_absolute_error(
        y_test,
        prediction
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            prediction
        )
    )

    return {
        "mae_c": float(mae),
        "rmse_c": float(rmse),
        "test_samples": len(y_test)
    }


# ============================================================
# ENTRENAR AMBOS MODELOS
# ============================================================

def train_models():

    global model_metrics
    global trained_at

    print("Generando dataset...")

    X, y = generate_dataset()

    print(
        f"Dataset generado: {len(X)} muestras"
    )

    print("Entrenando XGBoost...")

    xgb_metrics = train_xgboost(
        X,
        y
    )

    print(
        "XGBoost entrenado."
    )

    print("Entrenando LSTM...")

    lstm_metrics = train_lstm(
        X,
        y
    )

    print(
        "LSTM entrenado."
    )

    model_metrics = {
        "xgboost": xgb_metrics,
        "lstm": lstm_metrics,
        "training_samples": len(X),
        "features": FEATURES,
        "prediction_horizon_minutes":
            PREDICTION_HORIZON,
        "sequence_length":
            SEQUENCE_LENGTH
    }

    trained_at = (
        datetime
        .now(timezone.utc)
        .isoformat()
    )

    print(
        "Modelos entrenados correctamente."
    )


# ============================================================
# INICIALIZACIÓN
# ============================================================

@app.on_event("startup")
def startup():

    train_models()


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "ok",

        "models": {
            "xgboost":
                xgb_model is not None,

            "lstm":
                lstm_model is not None
        },

        "trained_at":
            trained_at
    }


# ============================================================
# MÉTRICAS
# ============================================================

@app.get("/metrics")
def metrics():

    return {
        "status": "trained",

        "models": [
            "XGBoost",
            "LSTM"
        ],

        "metrics":
            model_metrics,

        "trained_at":
            trained_at
    }


# ============================================================
# PREDICCIÓN
# ============================================================

@app.post("/predict")
def predict(
    request: PredictionRequest
):

    if (
        xgb_model is None
        or lstm_model is None
        or feature_scaler is None
        or target_scaler is None
    ):

        raise HTTPException(
            status_code=503,
            detail="Modelos no entrenados"
        )

    # --------------------------------------------------------
    # DATOS ACTUALES
    # --------------------------------------------------------

    current = np.array(
        [
            [
                request.temperature,
                request.humidity,
                request.cpu_load,
                request.airflow,
                request.power_kw
            ]
        ],
        dtype=np.float32
    )

    # --------------------------------------------------------
    # XGBOOST
    # --------------------------------------------------------

    xgb_prediction = float(
        xgb_model.predict(
            current
        )[0]
    )

    # --------------------------------------------------------
    # HISTORIAL LSTM
    # --------------------------------------------------------

    if (
        request.history
        and len(request.history)
        >= SEQUENCE_LENGTH
    ):

        history = np.asarray(
            request.history[
                -SEQUENCE_LENGTH:
            ],
            dtype=np.float32
        )

    else:

        # ----------------------------------------------------
        # HISTORIAL PROVISIONAL
        # ----------------------------------------------------
        #
        # Mientras todavía no exista telemetría IoT real,
        # utilizamos una secuencia estable alrededor de la
        # temperatura actual.
        #
        # No forzamos artificialmente una subida de 0.8 °C.

        baseline = current[0]

        history = np.tile(
            baseline,
            (
                SEQUENCE_LENGTH,
                1
            )
        )

        # Pequeña variación histórica para evitar que el LSTM
        # reciba 12 registros completamente idénticos.

        temperature_variation = np.linspace(
            request.temperature - 0.15,
            request.temperature,
            SEQUENCE_LENGTH
        )

        history[:, 0] = temperature_variation

    # --------------------------------------------------------
    # NORMALIZAR HISTORIAL
    # --------------------------------------------------------

    history_scaled = feature_scaler.transform(
        history
    )

    # --------------------------------------------------------
    # LSTM
    # --------------------------------------------------------

    lstm_prediction_scaled = float(
        lstm_model.predict(
            history_scaled[
                np.newaxis,
                ...
            ],
            verbose=0
        )[0][0]
    )

    # Regresar a grados Celsius.

    lstm_prediction = float(
        target_scaler.inverse_transform(
            np.array(
                [
                    [
                        lstm_prediction_scaled
                    ]
                ]
            )
        )[0][0]
    )

    # --------------------------------------------------------
    # LIMITACIÓN DE SEGURIDAD DE PREDICCIÓN
    # --------------------------------------------------------
    #
    # Esta protección evita resultados físicamente absurdos
    # durante la etapa de demostración cuando todavía no
    # tenemos historial IoT real.
    #
    # El modelo puede predecir una variación razonable,
    # pero no permitimos saltos extremos respecto a la
    # temperatura actual.

    minimum_prediction = request.temperature - 2.0
    maximum_prediction = request.temperature + 4.0

    xgb_prediction = float(
        np.clip(
            xgb_prediction,
            minimum_prediction,
            maximum_prediction
        )
    )

    lstm_prediction = float(
        np.clip(
            lstm_prediction,
            minimum_prediction,
            maximum_prediction
        )
    )

    # --------------------------------------------------------
    # ENSAMBLE
    # --------------------------------------------------------

    ensemble_prediction = (
        0.5 * xgb_prediction
        + 0.5 * lstm_prediction
    )

    # --------------------------------------------------------
    # RIESGO TÉRMICO
    # --------------------------------------------------------

    risk = np.clip(
        (
            ensemble_prediction - 25
        ) * 12.5,
        0,
        100
    )

    if risk >= 70:

        recommendation = (
            "Riesgo alto de incremento térmico. "
            "Aumentar ventilación y revisar "
            "el flujo de aire del rack."
        )

    elif risk >= 40:

        recommendation = (
            "Temperatura en rango preventivo. "
            "Mantener monitoreo y revisar "
            "la ventilación."
        )

    else:

        recommendation = (
            "Condiciones térmicas estables. "
            "Mantener configuración actual."
        )

    # --------------------------------------------------------
    # RESPUESTA
    # --------------------------------------------------------

    return {

        "prediction_horizon_minutes":
            PREDICTION_HORIZON,

        "prediction_temperature_c":
            round(
                ensemble_prediction,
                2
            ),

        "xgboost_prediction_c":
            round(
                xgb_prediction,
                2
            ),

        "lstm_prediction_c":
            round(
                lstm_prediction,
                2
            ),

        "risk_percentage":
            round(
                float(risk),
                1
            ),

        "recommendation":
            recommendation,

        "models": [
            "XGBoost",
            "LSTM"
        ]
    }