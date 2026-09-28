const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());

// ============================================================
// CONFIGURACIÓN DE POSTGRESQL
// ============================================================

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://postgres:password@localhost:5432/greenrack'
});

// ============================================================
// CONFIGURACIÓN JWT
// ============================================================

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'greenrack-development-secret-change-me';

// ============================================================
// CONFIGURACIÓN DEL SERVICIO DE IA
// ============================================================

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL ||
  'http://localhost:8000';

// ============================================================
// CONFIGURACIÓN MQTT / IoT
// ============================================================

const MQTT_BROKER =
  process.env.MQTT_BROKER ||
  'mqtt://127.0.0.1:1883';

const MQTT_TOPIC =
  process.env.MQTT_TOPIC ||
  'greenrack/telemetry';

// ============================================================
// VALIDACIÓN Y PERSISTENCIA DE TELEMETRÍA
// ============================================================

function validateTelemetry(data) {
  const required = [
    'rack',
    'temperature',
    'humidity',
    'cpu_load',
    'airflow',
    'power_kw'
  ];

  for (const field of required) {
    if (
      data[field] === undefined ||
      data[field] === null
    ) {
      return `El campo '${field}' es obligatorio`;
    }

    if (
      typeof data[field] !== 'number' ||
      !Number.isFinite(data[field])
    ) {
      return `El campo '${field}' debe ser numérico`;
    }
  }

  if (
    !Number.isInteger(Number(data.rack)) ||
    Number(data.rack) <= 0
  ) {
    return 'El rack debe ser un número entero positivo';
  }

  if (
    data.temperature < -20 ||
    data.temperature > 100
  ) {
    return 'La temperatura está fuera de rango';
  }

  if (
    data.humidity < 0 ||
    data.humidity > 100
  ) {
    return 'La humedad debe estar entre 0 y 100';
  }

  if (
    data.cpu_load < 0 ||
    data.cpu_load > 100
  ) {
    return 'La carga de CPU debe estar entre 0 y 100';
  }

  if (
    data.airflow < 0 ||
    data.airflow > 100
  ) {
    return 'El flujo de aire está fuera de rango';
  }

  if (
    data.power_kw < 0 ||
    data.power_kw > 1000
  ) {
    return 'El consumo energético está fuera de rango';
  }

  return null;
}

async function saveTelemetry(data) {
  const result = await pool.query(
    `
      INSERT INTO telemetry (
        device,
        rack,
        temperature,
        humidity,
        cpu_load,
        airflow,
        power_kw,
        recorded_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        COALESCE($8::timestamptz, NOW())
      )
      RETURNING *
    `,
    [
      data.device || null,
      Number(data.rack),
      data.temperature,
      data.humidity,
      data.cpu_load,
      data.airflow,
      data.power_kw,
      data.timestamp || null
    ]
  );

  return result.rows[0];
}

// ============================================================
// AUTENTICACIÓN Y AUTORIZACIÓN
// ============================================================

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({
      success: false,
      message: 'Token de autenticación requerido'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = jwt.verify(
      token,
      JWT_SECRET
    );

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
}

// ============================================================
// MQTT
// ============================================================

const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('MQTT conectado correctamente');
  console.log(
    `Broker MQTT: ${MQTT_BROKER}`
  );

  mqttClient.subscribe(
    MQTT_TOPIC,
    (err) => {
      if (err) {
        console.error(
          'Error suscribiéndose al topic MQTT:',
          err.message
        );
        return;
      }

      console.log(
        `Suscrito al topic: ${MQTT_TOPIC}`
      );
    }
  );
});

mqttClient.on('error', (error) => {
  console.error(
    'Error en conexión MQTT:',
    error.message
  );
});

mqttClient.on(
  'message',
  async (topic, message) => {
    try {
      const telemetry =
        JSON.parse(message.toString());

      console.log(
        '----------------------------------------'
      );

      console.log(
        'TELEMETRÍA IoT RECIBIDA'
      );

      console.log(
        `Topic: ${topic}`
      );

      console.log(telemetry);

      const validationError =
        validateTelemetry(telemetry);

      if (validationError) {
        console.error(
          'Telemetría inválida:',
          validationError
        );

        console.log(
          '----------------------------------------'
        );

        return;
      }

      const savedTelemetry =
        await saveTelemetry(telemetry);

      console.log(
        'Telemetría guardada en PostgreSQL:',
        savedTelemetry.id
      );

      console.log(
        '----------------------------------------'
      );
    } catch (error) {
      console.error(
        'Error procesando telemetría MQTT:',
        error.message
      );
    }
  }
);

// ============================================================
// RUTA PRINCIPAL
// ============================================================

app.get('/', (req, res) => {
  res.json({
    message:
      'API de GreenRack AI funcionando correctamente'
  });
});

// ============================================================
// AUTENTICACIÓN
// ============================================================

// POST /api/auth/login

app.post(
  '/api/auth/login',
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            'Email y contraseña son obligatorios'
        });
      }

      const result = await pool.query(
        `
          SELECT
            id,
            name,
            email,
            password_hash,
            role,
            active
          FROM users
          WHERE LOWER(email) = LOWER($1)
        `,
        [email.trim()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message:
            'Credenciales incorrectas'
        });
      }

      const user = result.rows[0];

      if (!user.active) {
        return res.status(403).json({
          success: false,
          message:
            'El usuario está desactivado'
        });
      }

      const passwordValid =
        await bcrypt.compare(
          password,
          user.password_hash
        );

      if (!passwordValid) {
        return res.status(401).json({
          success: false,
          message:
            'Credenciales incorrectas'
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        JWT_SECRET,
        {
          expiresIn: '8h'
        }
      );

      res.json({
        success: true,
        message:
          'Inicio de sesión exitoso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error(
        'Error en login:',
        error
      );

      res.status(500).json({
        success: false,
        message:
          'Error interno del servidor'
      });
    }
  }
);

// GET /api/auth/me

app.get(
  '/api/auth/me',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
          SELECT
            id,
            name,
            email,
            role,
            active,
            created_at
          FROM users
          WHERE id = $1
        `,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message:
            'Usuario no encontrado'
        });
      }

      const user = result.rows[0];

      if (!user.active) {
        return res.status(403).json({
          success: false,
          message:
            'El usuario está desactivado'
        });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error(
        'Error obteniendo usuario:',
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          'Error interno del servidor'
      });
    }
  }
);

// ============================================================
// RACKS
// ============================================================

app.get(
  '/api/racks',
  async (req, res) => {
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
  }
);

// ============================================================
// CONTROL DE RACK
// ============================================================

app.post(
  '/api/racks/control',
  async (req, res) => {
    const {
      rackNum,
      pwm
    } = req.body;

    res.json({
      success: true,
      message:
        `Comando IoT ejecutado: Ventilador del Rack #${rackNum} ajustado a ${pwm}% PWM.`
    });
  }
);

// ============================================================
// SALUD DEL SERVICIO DE IA
// ============================================================

app.get(
  '/api/ai/health',
  async (req, res) => {
    try {
      const response =
        await axios.get(
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
        message:
          'Servicio de IA no disponible',
        detail: error.message
      });
    }
  }
);

// ============================================================
// MÉTRICAS DE LOS MODELOS DE IA
// ============================================================

app.get(
  '/api/ai/metrics',
  async (req, res) => {
    try {
      const response =
        await axios.get(
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
        message:
          'No se pudieron obtener las métricas del servicio de IA',
        detail: error.message
      });
    }
  }
);

// ============================================================
// PREDICCIÓN DE IA CON TELEMETRÍA REAL
// ============================================================

app.post(
  '/api/ai/predict/:rackNum',
  async (req, res) => {
    const rackNum =
      Number.parseInt(
        req.params.rackNum,
        10
      );

    try {
      // --------------------------------------------------------
      // 1. Validar número de rack
      // --------------------------------------------------------

      if (
        !Number.isInteger(rackNum) ||
        rackNum <= 0
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'Número de rack inválido'
        });
      }

      // --------------------------------------------------------
      // 2. Obtener las últimas 12 mediciones reales
      // --------------------------------------------------------

      const historyResult =
        await pool.query(
          `
            SELECT
              temperature,
              humidity,
              cpu_load,
              airflow,
              power_kw,
              recorded_at
            FROM telemetry
            WHERE rack = $1
            ORDER BY recorded_at DESC
            LIMIT 12
          `,
          [rackNum]
        );

      if (historyResult.rowCount === 0) {
        return res.status(404).json({
          status: 'error',
          message:
            `No existe telemetría registrada para el Rack #${rackNum}`
        });
      }

      // --------------------------------------------------------
      // 3. Ordenar cronológicamente
      // --------------------------------------------------------

      const history =
        historyResult.rows.reverse();

      // --------------------------------------------------------
      // 4. Obtener medición más reciente
      // --------------------------------------------------------

      const latest =
        history[
          history.length - 1
        ];

      const telemetry = {
        temperature:
          Number(latest.temperature),
        humidity:
          Number(latest.humidity),
        cpu_load:
          Number(latest.cpu_load),
        airflow:
          Number(latest.airflow),
        power_kw:
          Number(latest.power_kw)
      };

      // --------------------------------------------------------
      // 5. Crear secuencia para LSTM
      // --------------------------------------------------------

      const historySequence =
        history.map((row) => [
          Number(row.temperature),
          Number(row.humidity),
          Number(row.cpu_load),
          Number(row.airflow),
          Number(row.power_kw)
        ]);

      console.log(
        '----------------------------------------'
      );

      console.log(
        `PREDICCIÓN IA - RACK #${rackNum}`
      );

      console.log(
        'Mediciones reales utilizadas:',
        history.length
      );

      console.log(
        'Telemetría actual:',
        telemetry
      );

      console.log(
        'Secuencia enviada al modelo:',
        historySequence
      );

      // --------------------------------------------------------
      // 6. Enviar datos al servicio IA
      // --------------------------------------------------------

      const response =
        await axios.post(
          `${AI_SERVICE_URL}/predict`,
          {
            temperature:
              telemetry.temperature,

            humidity:
              telemetry.humidity,

            cpu_load:
              telemetry.cpu_load,

            airflow:
              telemetry.airflow,

            power_kw:
              telemetry.power_kw,

            history:
              historySequence
          }
        );

      // --------------------------------------------------------
      // 7. Responder al frontend
      // --------------------------------------------------------

      res.json({
        rack: rackNum,

        data_source:
          'postgresql',

        telemetry_samples:
          history.length,

        latest_telemetry: {
          temperature:
            telemetry.temperature,

          humidity:
            telemetry.humidity,

          cpu_load:
            telemetry.cpu_load,

          airflow:
            telemetry.airflow,

          power_kw:
            telemetry.power_kw,

          recorded_at:
            latest.recorded_at
        },

        ...response.data
      });

      console.log(
        'Predicción generada correctamente'
      );

      console.log(
        '----------------------------------------'
      );
    } catch (error) {
      console.error(
        'Error en servicio de IA:',
        error.message
      );

      res.status(503).json({
        rack: rackNum,

        status: 'error',

        message:
          'No fue posible ejecutar la predicción',

        detail:
          error.response?.data ||
          error.message
      });
    }
  }
);

// ============================================================
// CRUD DE TELEMETRÍA
// ============================================================

// GET /api/telemetry

app.get(
  '/api/telemetry',
  async (req, res) => {
    try {
      const {
        rack,
        limit = 100
      } = req.query;

      const safeLimit =
        Math.min(
          Math.max(
            Number.parseInt(
              limit,
              10
            ) || 100,
            1
          ),
          500
        );

      let query =
        'SELECT * FROM telemetry';

      const values = [];

      if (rack) {
        const rackNumber =
          Number.parseInt(
            rack,
            10
          );

        if (
          !Number.isInteger(
            rackNumber
          ) ||
          rackNumber <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Rack inválido'
          });
        }

        query +=
          ' WHERE rack = $1';

        values.push(rackNumber);
      }

      query +=
        ' ORDER BY recorded_at DESC LIMIT $' +
        (values.length + 1);

      values.push(safeLimit);

      const result =
        await pool.query(
          query,
          values
        );

      res.json({
        success: true,
        count:
          result.rows.length,
        data:
          result.rows
      });
    } catch (error) {
      console.error(
        'Error obteniendo telemetría:',
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          'No fue posible obtener la telemetría'
      });
    }
  }
);

// GET /api/telemetry/:id

app.get(
  '/api/telemetry/:id',
  async (req, res) => {
    try {
      const id =
        Number.parseInt(
          req.params.id,
          10
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'ID de telemetría inválido'
        });
      }

      const result =
        await pool.query(
          'SELECT * FROM telemetry WHERE id = $1',
          [id]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message:
            'Telemetría no encontrada'
        });
      }

      res.json({
        success: true,
        data:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        'Error obteniendo telemetría:',
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          'No fue posible obtener la telemetría'
      });
    }
  }
);

// POST /api/telemetry

app.post(
  '/api/telemetry',
  async (req, res) => {
    try {
      const validationError =
        validateTelemetry(
          req.body
        );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError
        });
      }

      const telemetry =
        await saveTelemetry(
          req.body
        );

      res.status(201).json({
        success: true,
        message:
          'Telemetría registrada correctamente',
        data:
          telemetry
      });
    } catch (error) {
      console.error(
        'Error registrando telemetría:',
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          'No fue posible registrar la telemetría'
      });
    }
  }
);

// PUT /api/telemetry/:id

app.put(
  '/api/telemetry/:id',
  async (req, res) => {
    try {
      const id =
        Number.parseInt(
          req.params.id,
          10
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'ID de telemetría inválido'
        });
      }

      const validationError =
        validateTelemetry(
          req.body
        );

      if (validationError) {
        return res.status(400).json({
          success: false,
          message:
            validationError
        });
      }

      const result =
        await pool.query(
          `
            UPDATE telemetry
            SET
              device = $1,
              rack = $2,
              temperature = $3,
              humidity = $4,
              cpu_load = $5,
              airflow = $6,
              power_kw = $7
            WHERE id = $8
            RETURNING *
          `,
          [
            req.body.device || null,
            Number(req.body.rack),
            req.body.temperature,
            req.body.humidity,
            req.body.cpu_load,
            req.body.airflow,
            req.body.power_kw,
            id
          ]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message:
            'Telemetría no encontrada'
        });
      }

      res.json({
        success: true,
        message:
          'Telemetría actualizada correctamente',
        data:
          result.rows[0]
      });
    } catch (error) {
      console.error(
        'Error actualizando telemetría:',
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          'No fue posible actualizar la telemetría'
      });
    }
  }
);

// DELETE /api/telemetry/:id

app.delete(
  '/api/telemetry/:id',
  async (req, res) => {
    try {
      const id =
        Number.parseInt(
          req.params.id,
          10
        );

      if (
        !Number.isInteger(id) ||
        id <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'ID de telemetría inválido'
        });
      }

      const result =
        await pool.query(
          `
            DELETE FROM telemetry
            WHERE id = $1
            RETURNING id
          `,
          [id]
        );

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message:
            'Telemetría no encontrada'
        });
      }

      res.json({
        success: true,
        message:
          'Telemetría eliminada correctamente',
        id
      });
    } catch (error) {
      console.error(
        'Error eliminando telemetría:',
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          'No fue posible eliminar la telemetría'
      });
    }
  }
);

// ============================================================
// SERVIDOR
// ============================================================

const PORT =
  process.env.PORT || 4000;

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