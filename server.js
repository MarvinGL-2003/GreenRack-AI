const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Conexión a la Base de Datos PostgreSQL (configurada vía Docker)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/greenrack'
});

// 1. Endpoint raíz
app.get('/', (req, res) => {
  res.json({ message: "API de GreenRack AI funcionando correctamente" });
});

// 2. Obtener estado de todos los Racks (Simulación IoT / Base de datos)
app.get('/api/racks', async (req, res) => {
  try {
    // Puedes conectar esto a PostgreSQL; aquí devolvemos el estado operativo
    const racks = [
      { id: "A1", num: 1, label: "Rack #01", temp: 22.4, status: "normal", pwm: 40 },
      { id: "A2", num: 2, label: "Rack #02", temp: 23.1, status: "normal", pwm: 40 },
      { id: "A3", num: 3, label: "Rack #03", temp: 24.0, status: "normal", pwm: 42 },
      { id: "B1", num: 6, label: "Rack #06", temp: 25.8, status: "advertencia", pwm: 55 },
      { id: "C1", num: 12, label: "Rack #12", temp: 27.9, status: "critico", pwm: 78 },
    ];
    res.json(racks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Funcionalidad de IoT: Enviar comando PWM al actuador del Rack
app.post('/api/racks/control', async (req, res) => {
  const { rackNum, pwm } = req.body;
  // Aquí se enviaría la instrucción física al dispositivo IoT / Arduino
  res.json({ 
    success: true, 
    message: `Comando IoT ejecutado: Ventilador del Rack #${rackNum} ajustado a ${pwm}% PWM.` 
  });
});

// 4. Funcionalidad de IA: Modelo predictivo (LSTM/XGBoost simulado)
app.get('/api/ai/predict/:rackNum', (req, res) => {
  const { rackNum } = req.params;
  // Simulación de proyección a 15 minutos
  const forecast = [
    { min: "+0m", temp: 27.9 },
    { min: "+5m", temp: 28.2 },
    { min: "+10m", temp: 28.6 },
    { min: "+15m", temp: 29.1 }
  ];
  res.json({
    rack: rackNum,
    riskPercentage: 85,
    recommendation: "Incrementar ventilación PWM a 85% para evitar hotspot crítico.",
    forecast
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});