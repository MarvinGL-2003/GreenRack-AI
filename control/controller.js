const { spawn, exec } = require("child_process");
const path = require("path");
const net = require("net");
const express = require("express");
const cors = require("cors");
const os = require("os");

const ROOT = path.resolve(__dirname, "..");
const CONTROL_PORT = 5000;

const IS_WINDOWS = os.platform() === "win32";

const processes = {
  backend: null,
  ai: null,
  iot: null,
};

const app = express();

app.use(cors());
app.use(express.json());


// ============================================================
// INFORMACIÓN DEL SISTEMA
// ============================================================

console.log("==============================================");
console.log(" GREENRACK AI - CENTRO DE CONTROL");
console.log("==============================================");
console.log(
  `Sistema operativo: ${IS_WINDOWS ? "Windows" : "Linux"}`
);
console.log(`Directorio raíz: ${ROOT}`);
console.log("==============================================\n");


// ============================================================
// PROCESOS
// ============================================================

function startProcess(name, command, args, options = {}) {
  if (processes[name]) {
    console.log(`[${name}] Ya está siendo controlado.`);
    return false;
  }

  console.log(`[${name}] Iniciando...`);
  console.log(`[${name}] Comando: ${command} ${args.join(" ")}`);

  const child = spawn(command, args, {
    cwd: options.cwd || ROOT,

    env: {
      ...process.env,
      ...options.env,
    },

    stdio: ["ignore", "pipe", "pipe"],

    // Importante para Windows
    windowsHide: false,
  });

  processes[name] = child;

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("close", (code) => {
    console.log(
      `[${name}] Finalizado. Código: ${code}`
    );

    processes[name] = null;
  });

  child.on("error", (error) => {
    console.error(
      `[${name}] Error: ${error.message}`
    );

    processes[name] = null;
  });

  return true;
}


// ============================================================
// DETENER PROCESO CONTROLADO
// ============================================================

function stopControlledProcess(name) {
  const child = processes[name];

  if (!child) {
    return false;
  }

  console.log(
    `[${name}] Deteniendo proceso controlado...`
  );

  try {
    if (IS_WINDOWS) {
      // En Windows taskkill permite terminar también
      // los procesos hijos creados por el proceso.
      exec(
        `taskkill /PID ${child.pid} /T /F`,
        (error) => {
          if (error) {
            console.error(
              `[${name}] Error con taskkill: ${error.message}`
            );
          }
        }
      );
    } else {
      child.kill("SIGTERM");
    }
  } catch (error) {
    console.error(
      `[${name}] Error deteniendo: ${error.message}`
    );
  }

  processes[name] = null;

  return true;
}


// ============================================================
// OBTENER PIDs POR PUERTO - WINDOWS
// ============================================================

function getWindowsPidsByPort(port) {
  return new Promise((resolve) => {
    exec(
      `netstat -ano | findstr :${port}`,
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve([]);
          return;
        }

        const pids = new Set();

        const lines = stdout
          .split(/\r?\n/)
          .filter(Boolean);

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);

          if (parts.length < 5) {
            continue;
          }

          const localAddress = parts[1];
          const state = parts[3];
          const pid = parts[4];

          if (
            localAddress.endsWith(`:${port}`) &&
            (state === "LISTENING" || state === "ESCUCHANDO")
          ) {
            if (/^\d+$/.test(pid)) {
              pids.add(pid);
            }
          }
        }

        resolve([...pids]);
      }
    );
  });
}


// ============================================================
// DETENER PROCESO POR PID - WINDOWS
// ============================================================

function killWindowsPid(pid) {
  return new Promise((resolve) => {
    exec(
      `taskkill /PID ${pid} /T /F`,
      (error) => {
        if (error) {
          resolve(false);
          return;
        }

        console.log(
          `Proceso ${pid} detenido.`
        );

        resolve(true);
      }
    );
  });
}


// ============================================================
// DETENER PROCESOS EXTERNOS
// ============================================================

function stopBackendExternal() {
  if (IS_WINDOWS) {
    return new Promise(async (resolve) => {
      const pids = await getWindowsPidsByPort(4000);

      if (!pids.length) {
        resolve(false);
        return;
      }

      let stopped = false;

      for (const pid of pids) {
        const result = await killWindowsPid(pid);

        if (result) {
          stopped = true;

          console.log(
            `[backend] Proceso ${pid} detenido.`
          );
        }
      }

      resolve(stopped);
    });
  }

  // Linux
  return new Promise((resolve) => {
    exec(
      "lsof -ti :4000",
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve(false);
          return;
        }

        const pids = stdout
          .trim()
          .split("\n")
          .filter(Boolean);

        let stopped = false;

        for (const pid of pids) {
          exec(
            `kill ${pid}`,
            (killError) => {
              if (!killError) {
                stopped = true;

                console.log(
                  `[backend] Proceso ${pid} detenido.`
                );
              }
            }
          );
        }

        setTimeout(() => {
          resolve(stopped);
        }, 300);
      }
    );
  });
}


function stopAIExternal() {
  if (IS_WINDOWS) {
    return new Promise(async (resolve) => {
      const pids = await getWindowsPidsByPort(8000);

      if (!pids.length) {
        resolve(false);
        return;
      }

      let stopped = false;

      for (const pid of pids) {
        const result = await killWindowsPid(pid);

        if (result) {
          stopped = true;

          console.log(
            `[ai] Proceso ${pid} detenido.`
          );
        }
      }

      resolve(stopped);
    });
  }

  // Linux
  return new Promise((resolve) => {
    exec(
      "lsof -ti :8000",
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve(false);
          return;
        }

        const pids = stdout
          .trim()
          .split("\n")
          .filter(Boolean);

        let stopped = false;

        for (const pid of pids) {
          exec(
            `kill ${pid}`,
            (killError) => {
              if (!killError) {
                stopped = true;

                console.log(
                  `[ai] Proceso ${pid} detenido.`
                );
              }
            }
          );
        }

        setTimeout(() => {
          resolve(stopped);
        }, 300);
      }
    );
  });
}


// ============================================================
// DETENER IoT EXTERNO
// ============================================================

function stopIoTExternal() {
  // Windows
  if (IS_WINDOWS) {
    return new Promise((resolve) => {
      const command = `
        Get-CimInstance Win32_Process |
        Where-Object {
          $_.Name -match 'python(.exe)?' -and
          $_.CommandLine -match 'sensor.py'
        } |
        Select-Object -ExpandProperty ProcessId
      `;

      exec(
        `powershell -NoProfile -Command "${command.replace(
          /\n/g,
          " "
        )}"`,
        async (error, stdout) => {
          if (error || !stdout.trim()) {
            resolve(false);
            return;
          }

          const pids = stdout
            .trim()
            .split(/\r?\n/)
            .map((pid) => pid.trim())
            .filter((pid) => /^\d+$/.test(pid));

          if (!pids.length) {
            resolve(false);
            return;
          }

          let stopped = false;

          for (const pid of pids) {
            const result = await killWindowsPid(pid);

            if (result) {
              stopped = true;

              console.log(
                `[iot] Proceso ${pid} detenido.`
              );
            }
          }

          resolve(stopped);
        }
      );
    });
  }

  // Linux
  return new Promise((resolve) => {
    exec(
      "pgrep -f 'sensor.py'",
      (error, stdout) => {
        if (error || !stdout.trim()) {
          resolve(false);
          return;
        }

        const pids = stdout
          .trim()
          .split("\n")
          .filter(Boolean);

        let stopped = false;

        for (const pid of pids) {
          exec(
            `kill ${pid}`,
            (killError) => {
              if (!killError) {
                stopped = true;

                console.log(
                  `[iot] Proceso ${pid} detenido.`
                );
              }
            }
          );
        }

        setTimeout(() => {
          resolve(stopped);
        }, 300);
      }
    );
  });
}


// ============================================================
// INICIAR BACKEND
// ============================================================

async function startBackend() {
  if (await checkPort(4000)) {
    console.log(
      "[backend] Ya está activo en el puerto 4000."
    );

    return false;
  }

  const started = startProcess(
    "backend",
    "node",
    ["server.js"]
  );

  if (!started) {
    return false;
  }

  console.log(
    "[backend] Esperando a que el servidor esté disponible..."
  );

  for (let i = 0; i < 15; i++) {
    await sleep(1000);

    if (await checkPort(4000)) {
      console.log(
        "[backend] Servidor disponible en puerto 4000."
      );

      return true;
    }

    console.log(
      `[backend] Esperando... ${i + 1}/15`
    );
  }

  console.error(
    "[backend] El servidor no estuvo disponible después de 15 segundos."
  );

  return false;
}


// ============================================================
// INICIAR IA
// ============================================================

async function startAI() {
  const aiPath = path.join(
    ROOT,
    "system",
    "ai-service"
  );

  // Windows:
  // venv\Scripts\python.exe
  //
  // Linux:
  // venv/bin/python

  const pythonPath = IS_WINDOWS
    ? path.join(
        aiPath,
        "venv",
        "Scripts",
        "python.exe"
      )
    : path.join(
        aiPath,
        "venv",
        "bin",
        "python"
      );

  console.log(
    `[ai] Python seleccionado: ${pythonPath}`
  );

  // Verificar si la IA ya está activa

  if (await checkPort(8000)) {
    console.log(
      "[ai] Ya está activa en el puerto 8000."
    );

    return false;
  }

  const started = startProcess(
    "ai",
    pythonPath,
    [
      "-u",
      "-m",
      "uvicorn",
      "app:app",
      "--host",
      "0.0.0.0",
      "--port",
      "8000",
    ],
    {
      cwd: aiPath,
    }
  );

  if (!started) {
    return false;
  }

  console.log(
    "[ai] Esperando a que FastAPI esté disponible..."
  );

  // La IA necesita tiempo porque primero entrena
  // XGBoost y LSTM.

  for (let i = 0; i < 60; i++) {
    await sleep(1000);

    if (await checkPort(8000)) {
      console.log(
        "[ai] Servicio de IA disponible en puerto 8000."
      );

      return true;
    }

    console.log(
      `[ai] Esperando... ${i + 1}/60`
    );
  }

  console.error(
    "[ai] La IA no estuvo disponible después de 60 segundos."
  );

  return false;
}


// ============================================================
// INICIAR IoT
// ============================================================

async function startIoT() {
  const iotPath = path.join(
    ROOT,
    "iot-node"
  );

  // Windows:
  // venv\Scripts\python.exe
  //
  // Linux:
  // venv/bin/python

  const pythonPath = IS_WINDOWS
    ? path.join(
        iotPath,
        "venv",
        "Scripts",
        "python.exe"
      )
    : path.join(
        iotPath,
        "venv",
        "bin",
        "python"
      );

  console.log(
    `[iot] Python seleccionado: ${pythonPath}`
  );

  if (await checkIoT()) {
    console.log(
      "[iot] Ya está ejecutándose."
    );

    return false;
  }

  const started = startProcess(
    "iot",
    pythonPath,
    [
      "-u",
      "sensor.py",
    ],
    {
      cwd: iotPath,
    }
  );

  if (!started) {
    return false;
  }

  // Esperar un momento para verificar
  // que el proceso realmente quedó ejecutándose.

  await sleep(1000);

  if (await checkIoT()) {
    console.log(
      "[iot] Nodo IoT disponible."
    );

    return true;
  }

  console.error(
    "[iot] El nodo IoT no pudo iniciar correctamente."
  );

  return false;
}


// ============================================================
// DETENER SERVICIO
// ============================================================

async function stopService(name) {
  switch (name) {
    case "backend":

      if (
        stopControlledProcess("backend")
      ) {
        return true;
      }

      return await stopBackendExternal();


    case "ai":

      if (
        stopControlledProcess("ai")
      ) {
        return true;
      }

      return await stopAIExternal();


    case "iot":

      if (
        stopControlledProcess("iot")
      ) {
        return true;
      }

      return await stopIoTExternal();


    case "mqtt":

      // MQTT/Mosquitto se administra como
      // servicio del sistema.
      //
      // No se detiene desde este controlador.

      return false;


    default:
      return false;
  }
}


// ============================================================
// INICIAR TODO
// ============================================================

async function startAll() {
  console.log(
    "\n========== INICIANDO GREENRACK AI ==========\n"
  );


  // ----------------------------------------------------------
  // BACKEND
  // ----------------------------------------------------------

  const backendStarted =
    await startBackend();

  if (backendStarted) {
    console.log(
      "[all] Backend iniciado correctamente."
    );
  }


  // ----------------------------------------------------------
  // IA
  // ----------------------------------------------------------

  console.log(
    "[all] Iniciando servicio de IA..."
  );

  const aiStarted =
    await startAI();

  if (aiStarted) {
    console.log(
      "[all] IA iniciada correctamente."
    );
  } else if (
    await checkPort(8000)
  ) {
    console.log(
      "[all] IA ya estaba activa."
    );
  } else {
    console.error(
      "[all] No fue posible iniciar la IA."
    );
  }


  // ----------------------------------------------------------
  // IoT
  // ----------------------------------------------------------

  console.log(
    "[all] Iniciando nodo IoT..."
  );

  const iotStarted =
    await startIoT();

  if (iotStarted) {
    console.log(
      "[all] Nodo IoT iniciado correctamente."
    );
  } else if (
    await checkIoT()
  ) {
    console.log(
      "[all] Nodo IoT ya estaba activo."
    );
  } else {
    console.error(
      "[all] No fue posible iniciar el nodo IoT."
    );
  }


  console.log(
    "\n========== GREENRACK AI LISTO ==========\n"
  );
}


// ============================================================
// DETENER TODO
// ============================================================

async function stopAll() {
  console.log(
    "\n========== DETENIENDO GREENRACK AI ==========\n"
  );

  await stopService("iot");
  await stopService("ai");
  await stopService("backend");

  console.log(
    "\n========== SERVICIOS DETENIDOS ==========\n"
  );
}


// ============================================================
// COMPROBAR PUERTOS
// ============================================================

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    let finished = false;

    const finish = (result) => {
      if (finished) {
        return;
      }

      finished = true;

      try {
        socket.destroy();
      } catch (error) {
        // No hacer nada.
      }

      resolve(result);
    };

    socket.setTimeout(1000);

    socket.once("connect", () => {
      finish(true);
    });

    socket.once("timeout", () => {
      finish(false);
    });

    socket.once("error", () => {
      finish(false);
    });

    socket.connect(
      port,
      "127.0.0.1"
    );
  });
}


// ============================================================
// COMPROBAR IoT
// ============================================================

function checkIoT() {
  // Windows
  if (IS_WINDOWS) {
    return new Promise((resolve) => {
      const command = `
        Get-CimInstance Win32_Process |
        Where-Object {
          $_.Name -match 'python(.exe)?' -and
          $_.CommandLine -match 'sensor.py'
        } |
        Select-Object -ExpandProperty ProcessId
      `;

      exec(
        `powershell -NoProfile -Command "${command.replace(
          /\n/g,
          " "
        )}"`,
        (error, stdout) => {
          resolve(
            !error &&
            stdout.trim().length > 0
          );
        }
      );
    });
  }

  // Linux
  return new Promise((resolve) => {
    exec(
      "pgrep -af 'sensor.py' | grep -v grep",
      (error, stdout) => {
        resolve(
          !error &&
          stdout.trim().length > 0
        );
      }
    );
  });
}


// ============================================================
// ESPERAR
// ============================================================

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(
      resolve,
      milliseconds
    );
  });
}


// ============================================================
// ESTADO REAL
// ============================================================

async function getStatus() {
  const backend =
    await checkPort(4000);

  const ai =
    await checkPort(8000);

  const mqtt =
    await checkPort(1883);

  const iot =
    await checkIoT();

  return {
    mqtt,
    backend,
    ai,
    iot,
  };
}


// ============================================================
// MOSTRAR ESTADO EN CONSOLA
// ============================================================

async function realStatus() {
  const status =
    await getStatus();

  console.log(
    "\n========== GREENRACK AI =========="
  );

  console.log(
    `MQTT:    ${
      status.mqtt
        ? "🟢 ACTIVO"
        : "🔴 DETENIDO"
    }`
  );

  console.log(
    `Backend: ${
      status.backend
        ? "🟢 ACTIVO"
        : "🔴 DETENIDO"
    }`
  );

  console.log(
    `IA:      ${
      status.ai
        ? "🟢 ACTIVA"
        : "🔴 DETENIDA"
    }`
  );

  console.log(
    `IoT:     ${
      status.iot
        ? "🟢 ACTIVO"
        : "🔴 DETENIDO"
    }`
  );

  console.log(
    "==================================\n"
  );

  return status;
}


// ============================================================
// API STATUS
// ============================================================

app.get(
  "/api/system/status",
  async (req, res) => {
    try {
      const status =
        await getStatus();

      res.json({
        success: true,
        services: status,
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }
);


// ============================================================
// BACKEND
// ============================================================

app.post(
  "/api/system/backend/start",
  async (req, res) => {

    const started =
      await startBackend();

    res.json({
      success: true,
      started,

      message:
        started
          ? "Backend iniciado correctamente."
          : "Backend ya estaba activo.",
    });
  }
);


app.post(
  "/api/system/backend/stop",
  async (req, res) => {

    const stopped =
      await stopService("backend");

    res.json({
      success: true,
      stopped,

      message:
        stopped
          ? "Backend detenido."
          : "Backend ya estaba detenido.",
    });
  }
);


// ============================================================
// IA
// ============================================================

app.post(
  "/api/system/ai/start",
  async (req, res) => {

    const started =
      await startAI();

    // Verificar el estado final real

    const active =
      await checkPort(8000);

    res.json({
      success: true,
      started,
      active,

      message:
        active
          ? "Servicio de IA iniciado correctamente."
          : "No fue posible iniciar el servicio de IA.",
    });
  }
);


app.post(
  "/api/system/ai/stop",
  async (req, res) => {

    const stopped =
      await stopService("ai");

    // Verificar que realmente se haya detenido

    await sleep(300);

    const active =
      await checkPort(8000);

    res.json({
      success: !active,
      stopped,
      active,

      message:
        !active
          ? "Servicio de IA detenido."
          : "La IA continúa activa.",
    });
  }
);


// ============================================================
// IoT
// ============================================================

app.post(
  "/api/system/iot/start",
  async (req, res) => {

    const started =
      await startIoT();

    const active =
      await checkIoT();

    res.json({
      success: true,
      started,
      active,

      message:
        active
          ? "Nodo IoT iniciado correctamente."
          : "No fue posible iniciar el nodo IoT.",
    });
  }
);


app.post(
  "/api/system/iot/stop",
  async (req, res) => {

    const stopped =
      await stopService("iot");

    await sleep(300);

    const active =
      await checkIoT();

    res.json({
      success: !active,
      stopped,
      active,

      message:
        !active
          ? "Nodo IoT detenido."
          : "El nodo IoT continúa activo.",
    });
  }
);


// ============================================================
// START ALL
// ============================================================

app.post(
  "/api/system/start-all",
  async (req, res) => {

    await startAll();

    const status =
      await getStatus();

    res.json({
      success: true,
      services: status,

      message:
        "Proceso de inicio de servicios completado.",
    });
  }
);


// ============================================================
// STOP ALL
// ============================================================

app.post(
  "/api/system/stop-all",
  async (req, res) => {

    await stopAll();

    const status =
      await getStatus();

    res.json({
      success: true,
      services: status,

      message:
        "Servicios detenidos.",
    });
  }
);


// ============================================================
// SERVIDOR
// ============================================================

app.listen(
  CONTROL_PORT,
  "0.0.0.0",
  () => {
    console.log(
      `Centro de Control disponible en puerto ${CONTROL_PORT}`
    );

    console.log(
      `Sistema detectado: ${
        IS_WINDOWS
          ? "Windows"
          : "Linux"
      }`
    );
  }
);


// ============================================================
// CIERRE
// ============================================================

process.on(
  "SIGINT",
  async () => {

    console.log(
      "\nDeteniendo servicios..."
    );

    await stopAll();

    process.exit(0);
  }
);


// ============================================================
// COMANDOS
// ============================================================

const command =
  process.argv[2];

switch (command) {

  case "backend":
    startBackend();
    break;

  case "ai":
    startAI();
    break;

  case "iot":
    startIoT();
    break;

  case "all":
    startAll();
    break;

  case "stop":
    stopAll();
    break;

  case "status":
    realStatus();
    break;

  default:

    console.log(`
GreenRack AI - Centro de Control

Comandos:

  node control/controller.js backend

  node control/controller.js ai

  node control/controller.js iot

  node control/controller.js all

  node control/controller.js stop

  node control/controller.js status


API:

  GET  /api/system/status

  POST /api/system/backend/start
  POST /api/system/backend/stop

  POST /api/system/ai/start
  POST /api/system/ai/stop

  POST /api/system/iot/start
  POST /api/system/iot/stop

  POST /api/system/start-all
  POST /api/system/stop-all
`);
}