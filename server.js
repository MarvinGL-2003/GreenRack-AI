const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:password@localhost:5432/greenrack'
});

// ============================================================
// CONFIGURACIÓN DEL SERVICIO DE IA
// ============================================================

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || 'http://localhost:8000';


// ============================================================
// RUTA PRINCIPAL
// ============================================================

app.get('/', (req, res) => {
  res.json({
    message: 'API de GreenRack AI funcionando correctamente'
  });
});


// ============================================================
// RACKS
// ============================================================

app.get('/api/racks', async (req, res) => {
  try {
    const racks = [
      {
        id: 'A1',
        num: 1,
        label: 'Rack #01',
        temp: 22.4,
        status: 'normal',
        pwm: 40
      },
      {
        id: 'A2',
        num: 2,
        label: 'Rack #02',
        temp: 23.1,
        status: 'normal',
        pwm: 40
      },
      {
        id: 'A3',
        num: 3,
        label: 'Rack #03',
        temp: 24.0,
        status: 'normal',
        pwm: 42
      },
      {
        id: 'B1',
        num: 6,
        label: 'Rack #06',
        temp: 25.8,
        status: 'advertencia',
        pwm: 55
      },
      {
        id: 'C1',
        num: 12,
        label: 'Rack #12',
        temp: 27.9,
        status: 'critico',
        pwm: 78
      }
    ];

    res.json(racks);

  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});


// ============================================================
// CONTROL DE RACK
// ============================================================

app.post('/api/racks/control', async (req, res) => {
  const { rackNum, pwm } = req.body;

  res.json({
    success: true,
    message:
      `Comando IoT ejecutado: Ventilador del Rack #${rackNum} ajustado a ${pwm}% PWM.`
  });
});


// ============================================================
// SALUD DEL SERVICIO DE IA
// ============================================================

app.get('/api/ai/health', async (req, res) => {

  try {

    const response = await axios.get(
      `${AI_SERVICE_URL}/health`
    );

    res.json(response.data);

  } catch (error) {

    console.error(
      'Error conectando con servicio de IA:',
      error.message
    );

    res.status(503).json({
      status: 'error',
      message: 'Servicio de IA no disponible',
      detail: error.message
    });
  }
});


// ============================================================
// MÉTRICAS DE LOS MODELOS DE IA
// ============================================================

app.get('/api/ai/metrics', async (req, res) => {

  try {

    const response = await axios.get(
      `${AI_SERVICE_URL}/metrics`
    );

    res.json(response.data);

  } catch (error) {

    console.error(
      'Error obteniendo métricas de IA:',
      error.message
    );

    res.status(503).json({
      status: 'error',
      message: 'No se pudieron obtener las métricas del servicio de IA',
      detail: error.message
    });
  }
});


// ============================================================
// PREDICCIÓN DE IA
// ============================================================

app.post('/api/ai/predict/:rackNum', async (req, res) => {

  const { rackNum } = req.params;

  try {

    const {
      temperature,
      humidity,
      cpu_load,
      airflow,
      power_kw,
      history
    } = req.body;


    // --------------------------------------------------------
    // ENVIAR TELEMETRÍA AL SERVICIO PYTHON
    // --------------------------------------------------------

    const response = await axios.post(
      `${AI_SERVICE_URL}/predict`,
      {
        temperature,
        humidity,
        cpu_load,
        airflow,
        power_kw,
        history
      }
    );


    // --------------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------------

    res.json({
      rack: rackNum,
      ...response.data
    });

  } catch (error) {

    console.error(
      'Error en servicio de IA:',
      error.message
    );

    res.status(503).json({
      rack: rackNum,
      status: 'error',
      message: 'No fue posible ejecutar la predicción',
      detail:
        error.response?.data ||
        error.message
    });
  }
});


// ============================================================
// SERVIDOR
// ============================================================

const PORT = process.env.PORT || 4000;

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Backend corriendo en puerto ${PORT}`
    );

    console.log(
      `Servicio de IA configurado en: ${AI_SERVICE_URL}`
    );
  }
);