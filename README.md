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
