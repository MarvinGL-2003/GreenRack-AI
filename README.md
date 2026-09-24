# 🌡️ GreenRack AI
## Sistema de Optimización Térmica para Centros de Datos

---

## 📋 Contenido

1. [El Problema](#1-el-problema)
2. [Nuestra Solución](#2-nuestra-solución)
3. [Tecnologías Clave](#3-tecnologías-clave)
4. [¿Por qué esta combinación?](#4-por-qué-esta-combinación)
5. [Modelo de Negocio](#5-modelo-de-negocio)
6. [Cómo Funciona](#6-cómo-funciona)
7. [Plan de Implementación](#7-plan-de-implementación)
8. [Pantallas del Sistema](#8-pantallas-del-sistema)
9. [Referencias](#9-referencias)

---
# 🌱 GreenRack AI — Guía de ejecución

Esta guía permite ejecutar la versión actual de GreenRack AI con:

* React/Vite
* Node.js + Express
* Servicio de IA con Python/FastAPI
* Nodo IoT con Python
* MQTT mediante Mosquitto

La arquitectura actual es:

```text
Nodo IoT
   ↓
MQTT
   ↓
Mosquitto
   ↓
Express
   ↓
Servicio IA
   ↓
Web / App móvil
```

---

# 🪟 WINDOWS

## 1. Instalar Git

Descargar e instalar Git para Windows desde:

https://git-scm.com/download/win

Después comprobar:

```powershell
git --version
```

---

## 2. Instalar Node.js

Instalar una versión LTS de Node.js desde:

https://nodejs.org/

Comprobar:

```powershell
node --version
npm --version
```

---

## 3. Instalar Python

Instalar Python 3.12 desde:

https://www.python.org/downloads/

Durante la instalación es importante activar:

```text
Add Python to PATH
```

Comprobar:

```powershell
python --version
```

Debe ser Python 3.12.x.

---

# 4. Clonar GreenRack AI

Abrir PowerShell:

```powershell
git clone https://github.com/MarvinGL-2003/GreenRack-AI.git
cd GreenRack-AI
```

---

# 5. Instalar dependencias de Node

Ejecutar:

```powershell
npm install --legacy-peer-deps
```

---

# 6. Crear configuración `.env`

Ejecutar:

```powershell
Copy-Item .env.example .env
```

No es necesario modificarlo para una prueba local.

---

# 7. Instalar Mosquitto

Descargar el instalador oficial de Mosquitto para Windows desde:

https://mosquitto.org/download/

Instalarlo.

Después abrir PowerShell como administrador y comprobar que Mosquitto está instalado:

```powershell
mosquitto -h
```

Si el comando no es reconocido, utilizar la ruta de instalación de Mosquitto, normalmente:

```text
C:\Program Files\mosquitto\
```

---

# 8. Iniciar Mosquitto

Abrir PowerShell como administrador:

```powershell
mosquitto -c "C:\Program Files\mosquitto\mosquitto.conf" -v
```

Dejar esta terminal abierta.

---

# 9. Preparar el nodo IoT

Abrir otra terminal PowerShell:

```powershell
cd GreenRack-AI\iot-node
```

Crear el entorno virtual:

```powershell
python -m venv venv
```

Activarlo:

```powershell
.\venv\Scripts\Activate.ps1
```

Si PowerShell bloquea la ejecución de scripts, ejecutar:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

y volver a ejecutar:

```powershell
.\venv\Scripts\Activate.ps1
```

Instalar las dependencias:

```powershell
python -m pip install -r requirements.txt
```

---

# 10. Ejecutar el nodo IoT

Con el entorno virtual activado:

```powershell
python sensor.py
```

Debe aparecer:

```text
GREENRACK AI - NODO IoT
Estado: ONLINE

MQTT: CONECTADO
Broker: 127.0.0.1:1883
Topic: greenrack/telemetry
```

El nodo enviará datos de los racks:

```text
1
6
12
18
```

---

# 11. Ejecutar Express

Abrir otra terminal:

```powershell
cd GreenRack-AI
node server.js
```

Debe aparecer:

```text
Backend corriendo en puerto 4000
Servicio de IA configurado en: http://localhost:8000
MQTT conectado correctamente
Suscrito al topic: greenrack/telemetry
```

Después deben aparecer mensajes:

```text
TELEMETRÍA IoT RECIBIDA
```

Esto confirma:

```text
sensor.py
   ↓
Mosquitto
   ↓
Express
```

---

# 12. Ejecutar el servicio de IA

Abrir otra terminal:

```powershell
cd GreenRack-AI\system\ai-service
```

Crear el entorno:

```powershell
python -m venv venv
```

Activarlo:

```powershell
.\venv\Scripts\Activate.ps1
```

Instalar dependencias:

```powershell
python -m pip install -r requirements.txt
```

Ejecutar:

```powershell
uvicorn app:app --host 0.0.0.0 --port 8000
```

---

# 13. Ejecutar el frontend web

Abrir otra terminal:

```powershell
cd GreenRack-AI
npm run dev
```

Vite mostrará una dirección parecida a:

```text
http://localhost:5173/
```

Abrir esa dirección en el navegador.

---

# 🐧 LINUX / FEDORA

## 1. Instalar Git, Node.js y Python

En Fedora:

```bash
sudo dnf install git nodejs python3.12
```

Comprobar:

```bash
git --version
node --version
npm --version
python3 --version
```

---

# 2. Clonar el proyecto

```bash
git clone https://github.com/MarvinGL-2003/GreenRack-AI.git
cd GreenRack-AI
```

---

# 3. Instalar dependencias de Node

```bash
npm install --legacy-peer-deps
```

---

# 4. Crear `.env`

```bash
cp .env.example .env
```

---

# 5. Instalar Mosquitto

En Fedora:

```bash
sudo dnf install mosquitto
```

Activarlo:

```bash
sudo systemctl enable --now mosquitto
```

Comprobar:

```bash
systemctl is-active mosquitto
```

Debe mostrar:

```text
active
```

---

# 6. Preparar el nodo IoT

```bash
cd iot-node
python3.12 -m venv venv
source venv/bin/activate
```

Instalar:

```bash
pip install -r requirements.txt
```

Ejecutar:

```bash
python sensor.py
```

---

# 7. Ejecutar Express

En otra terminal:

```bash
cd GreenRack-AI
node server.js
```

Debe mostrar:

```text
MQTT conectado correctamente
Suscrito al topic: greenrack/telemetry
```

---

# 8. Ejecutar el servicio de IA

Otra terminal:

```bash
cd GreenRack-AI/system/ai-service
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

---

# 9. Ejecutar el frontend

Otra terminal:

```bash
cd GreenRack-AI
npm run dev
```

Abrir la dirección que muestre Vite.

---

# 📱 IMPORTANTE PARA LA APP MÓVIL

Si van a ejecutar la aplicación Expo desde un teléfono físico, `localhost` NO representa la computadora.

Deben utilizar la IP local de la computadora que está ejecutando Express.

Por ejemplo:

```text
http://192.168.0.13:4000
```

Pero cada integrante debe utilizar la IP de SU propia computadora.

Para conocerla:

### Windows

```powershell
ipconfig
```

Buscar:

```text
IPv4 Address
```

### Linux

```bash
ip addr
```

Buscar la dirección IPv4 de la conexión de red.

El teléfono y la computadora deben estar conectados a la misma red Wi-Fi/LAN.

---

# 🧪 ORDEN DE EJECUCIÓN

Para probar todo el sistema, seguir este orden:

### Terminal 1 — MQTT

Windows:

```powershell
mosquitto -c "C:\Program Files\mosquitto\mosquitto.conf" -v
```

Linux:

```bash
systemctl is-active mosquitto
```

### Terminal 2 — Nodo IoT

```text
iot-node
↓
python sensor.py
```

### Terminal 3 — Backend

```text
node server.js
```

### Terminal 4 — IA

```text
uvicorn app:app --host 0.0.0.0 --port 8000
```

### Terminal 5 — Web

```text
npm run dev
```

---

# ✅ ¿Cómo saber si funciona?

En `server.js` debe aparecer repetidamente:

```text
TELEMETRÍA IoT RECIBIDA
```

junto con información como:

```text
rack: 1
temperature: 25
humidity: ...
cpu_load: ...
airflow: ...
power_kw: ...
```

Si aparece eso, la comunicación IoT está funcionando correctamente.

---

# ⚠️ IMPORTANTE

NO subir a GitHub:

```text
.env
node_modules/
venv/
```

Estos archivos y carpetas ya están configurados en `.gitignore`.

Sí deben estar en GitHub:

```text
.env.example
iot-node/sensor.py
iot-node/requirements.txt
package.json
package-lock.json
server.js
```

Si algún comando genera un error, enviar el error completo al equipo antes de cambiar versiones o eliminar archivos.


## 1. El Problema

### 🔥 ¿Qué está pasando?

Los centros de datos consumen mucha energía para enfriar los servidores. 

### 📊 Datos clave

| Problema | Impacto |
|----------|---------|
| 50% de la energía | Se gasta en climatización |
| PUE de 1.3 - 2.0 | Muy ineficiente |
| 15 minutos | Tiempo para que un punto caliente dañe servidores |

### ⚠️ Consecuencias

- **Hardware dañado** por altas temperaturas
- **Apagados inesperados** que interrumpen servicios
- **Mucho gasto** en energía innecesaria
- **Incumplimiento** de acuerdos con clientes (SLA)

---

## 2. Nuestra Solución

### 🎯 Objetivo Principal

Un sistema que **predice y previene** los puntos calientes en servidores, enfriando solo donde y cuando se necesita.

### 📌 Metas Específicas

1. **Monitoreo 3D**: Sensores en 3 niveles del rack (inferior, medio, superior) midiendo temperatura, humedad, presión y flujo de aire.

2. **Predicción inteligente**: IA que anticipa puntos calientes con solo **2.5°C de error**.

3. **Enfriamiento automático**: El sistema enfría antes de que ocurra el problema.

4. **Ahorro de energía**: Reducir el gasto en ventilación en **15% - 25%**.

### 📌 Prototipo UX/UI: https://www.figma.com/make/IfLXfa8HNK8DFhI1w2sqp8/Sistema-de-Optimizaci%C3%B3n-T%C3%A9rmica-Proactiva-y-Eficiencia-Energ%C3%A9tica-para-Centros-de-Datos?code-node-id=0-6&p=f&t=mmdsLzLHYBYBAjbU-0&fullscreen=1

---

## 3. Tecnologías Clave

### 📡 IoT (Internet de las Cosas)

**¿Qué es?** Red de sensores físicos que recolectan datos del entorno.

**¿Cómo funciona?**
- Sensores → PIC16F88 (microcontrolador) → Arduino Yún (puente) → Nube

**Ejemplos reales:** Google DeepMind (40% ahorro), Equinix

| ✅ Ventajas | ❌ Limitaciones |
|-------------|----------------|
| Bajo costo | Necesita red estable |
| Fácil de escalar | Puede tener retrasos |
| Datos precisos | Requiere mantenimiento |

---

### 🧠 Inteligencia Artificial (IA)

#### Modelo 1: Redes Neuronales LSTM

**Para qué sirve:** Analiza tendencias de temperatura a lo largo del tiempo.

**Ventaja:** Captura la "inercia térmica" (cómo el calor se acumula lentamente).

#### Modelo 2: XGBoost

**Para qué sirve:** Predice temperatura basado en carga de trabajo del servidor.

**Ventaja:** **Muy rápido** y preciso (error de solo **2.38°C**).

---

## 4. ¿Por qué esta combinación?

### 🤝 IoT + IA = Control Proactivo

**Solo IoT (sin IA):**
- Reacciona **después** de que la temperatura sube
- El servidor ya se dañó antes de que actúe

**Solo IA (sin IoT):**
- No tiene datos físicos reales del entorno
- No sabe qué pasa en cada nivel del rack

**IoT + IA (nuestra solución):**
- IoT: Los "ojos" que ven el estado físico
- IA: El "cerebro" que predice y decide
- **Resultado:** Actúa **antes** del problema, no después

### 💰 Valor Agregado

| Tecnología | Lo que aporta |
|------------|---------------|
| IoT | Datos precisos de cada nivel del rack |
| IA | Predicción con 15 minutos de anticipación |
| Juntos | Enfriamiento focalizado donde y cuando se necesita |

---

## 5. Modelo de Negocio

### 🎯 ¿A quién le vendemos?

| Segmento | Ejemplos |
|----------|----------|
| Telecomunicaciones | Claro, Tigo |
| Proveedores de nube | AWS, Azure |
| Empresas financieras | Bancos con data centers |
| Universidades | Centros de investigación |

### 💵 ¿Cómo ganamos dinero?

| Fuente de Ingreso | Descripción |
|-------------------|-------------|
| Licencias de software | Uso de la plataforma |
| Kits de hardware IoT | Sensores y controladores |
| Consultoría | Implementación personalizada |
| Suscripción | Monitoreo continuo |
| Soporte premium | Mantenimiento 24/7 |

### 💸 Estructura de Costos

- Investigación y desarrollo
- Fabricación de sensores
- Personal especializado (ingenieros, data scientists)
- Infraestructura en la nube
- Marketing y ventas

### 🤝 Socios Clave

- Fabricantes de servidores (Dell, HP)
- Proveedores de HVAC (sistemas de enfriamiento)
- Universidades (investigación)
- Integradores de sistemas

---

## 6. Cómo Funciona

### 📊 Arquitectura en 4 Capas
┌─────────────────────────────────────────────────────────┐
│ 1. CAPA DE CONTROL PROACTIVO │
│ → La IA decide y envía órdenes a los ventiladores │
├─────────────────────────────────────────────────────────┤
│ 2. CAPA DE ALMACENAMIENTO E INFERENCIA │
│ → Modelos LSTM y XGBoost analizan datos y predicen │
├─────────────────────────────────────────────────────────┤
│ 3. CAPA DE RED E INTERMEDIACIÓN │
│ → Arduino Yún recibe y envía datos (MQTT, REST API) │
├─────────────────────────────────────────────────────────┤
│ 4. CAPA FÍSICA Y DE BORDE │
│ → Sensores en el rack + microcontrolador PIC16F88 │
└─────────────────────────────────────────────────────────┘


### 🔄 Flujo de Datos

1. **Sensores** miden temperatura, humedad, flujo, presión
2. **PIC16F88** recolecta datos de los 3 niveles del rack
3. **Arduino Yún** envía datos a la nube vía MQTT
4. **IA (XGBoost + LSTM)** predice dónde y cuándo habrá un punto caliente
5. **Sistema** envía orden a ventiladores para enfriar antes de que ocurra

### ⏱️ Tiempo de Anticipación

**15 minutos** antes de que el punto caliente se forme, el sistema ya está actuando.

---

## 7. Plan de Implementación

### 📅 4 Fases (16 semanas)

| Fase | Tiempo | Qué hacemos |
|------|--------|-------------|
| **1. Diseño Electrónico** | Semanas 1-4 | Compramos y calibramos sensores. Diseñamos circuitos. |
| **2. Comunicaciones** | Semanas 5-8 | Programamos microcontroladores. Configuramos bases de datos. |
| **3. Modelos de IA** | Semanas 9-12 | Entrenamos XGBoost y LSTM con datos históricos. |
| **4. Integración** | Semanas 13-16 | Unimos todo. Probamos en servidores reales. |

### 🛠️ Herramientas

| Categoría | Herramientas |
|-----------|--------------|
| Hardware | PIC16F88, Arduino Yún, sensores DHT22, nRF24L01+ |
| Software | Python, TensorFlow, Scikit-learn |
| Bases de datos | InfluxDB, MongoDB |
| Comunicación | MQTT, REST API |
| Diseño | Figma, Adobe XD |
| Control de versiones | Git, GitHub |

### 👥 Equipo Necesario

- 2 Ingenieros de Hardware
- 1 Ingeniero de Firmware
- 2 Data Scientists
- 1 Ingeniero de Software
- 1 Gerente de Proyecto

---

## 8. Pantallas del Sistema

### 🖥️ Pantalla 1: Dashboard General

**Vista de toda la sala de servidores**



**Lo que ves:**
- Mapa de todos los racks con colores (verde = bien, rojo = alerta)
- Métricas globales: PUE, consumo, alertas activas
- Clic en un rack → ves detalles

---

### 📊 Pantalla 2: Vista Detallada del Rack

**Telemetría en tiempo real de cada nivel**



**Lo que ves:**
- 3 niveles del rack (inferior, medio, superior)
- Temperatura, humedad, flujo de aire
- Alertas visuales de puntos calientes

---

### 🎮 Pantalla 3: Panel de Control Predictivo

**Predicción de la IA y acciones automáticas**



**Lo que ves:**
- Gráfica: temperatura actual vs predicción a 15 min
- Qué acción está tomando el sistema ("Aumentando ventilador al 80%")
- Ahorro energético estimado

---

### 📈 Pantalla 4: Historial y Análisis

**Reportes y datos históricos**

![Historial]

**Lo que ves:**
- Filtros de fecha
- Gráficas de temperatura y consumo
- Reportes de ahorro energético

---

### 🧭 Flujo de Navegación
Dashboard General
↓ (clic en un rack)
Vista Detallada del Rack
↓ (clic en "Control Predictivo")
Panel de Control Predictivo
↓ (clic en "Ver Historial")
Historial y Análisis


---

## 9. Referencias

### 📚 Fuentes Bibliográficas

[1] M. Torres y F. Díaz, "Arquitecturas de Borde para Centros de Datos Inteligentes: Una Revisión Sistemática," Revista Iberoamericana de Tecnología, vol. 18, no. 4, pp. 78-92, 2025. Disponible en: https://rd.udb.edu.sv/home

[2] ASHRAE, Guía Térmica para Entornos de Procesamiento de Datos, 5ª ed. Atlanta, GA, EE.UU.: ASHRAE, 2024. Disponible en: https://www.ashrae.org/technical-resources/bookstore/thermal-guidelines

[3] "Guía de Diseño de Centros de Datos para Cargas de Trabajo de IA," Schneider Electric, Tech. Rep., 2025. [Documento técnico en español disponible en la biblioteca de recursos de Schneider Electric].

---

## 📊 Resumen de Métricas

| Indicador | Valor |
|-----------|-------|
| Error de predicción | < 2.5°C |
| Ahorro energético | 15% - 25% |
| Tiempo de anticipación | 15 minutos |
| PUE mejorado | 1.15 - 1.25 |

---

*Documento preparado por el equipo GreenRack AI - Investigación Aplicada 1*
