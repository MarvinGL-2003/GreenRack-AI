import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Zap, Battery, Bell, ShieldCheck, Home, Server, TrendingUp, History,
  ChevronLeft, Thermometer, Send, Activity, Calendar, AlertTriangle, CheckCircle2,
} from "lucide-react";

// ---------- Design tokens (from GreenRack AI mockup) ----------
const C = {
  bg: "#0A0F1C",
  panel: "#131B2E",
  panelAlt: "#1A2338",
  border: "#243049",
  textPrimary: "#E2E8F0",
  textSecondary: "#64748B",
  blue: "#2563EB",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
};

const PASILLOS = ["A", "B", "C", "D"];
const FILAS = [1, 2, 3, 4, 5, 6];

function buildInitialRacks() {
  const racks = [];
  let num = 0;
  FILAS.forEach((fila) => {
    PASILLOS.forEach((pasillo) => {
      num += 1;
      let temp = 22 + Math.random() * 2.2;
      let status = "normal";
      if (num === 6) { temp = 25.8; status = "advertencia"; }
      if (num === 12) { temp = 27.9; status = "critico"; }
      if (num === 18) { temp = 26.3; status = "advertencia"; }
      racks.push({
        id: `${pasillo}${fila}`,
        num,
        label: `Rack #${String(num).padStart(2, "0")}`,
        pasillo,
        fila,
        temp: Number(temp.toFixed(1)),
        status,
        pwm: status === "critico" ? 78 : status === "advertencia" ? 55 : 40,
      });
    });
  });
  return racks;
}

function statusColor(status) {
  if (status === "critico") return C.red;
  if (status === "advertencia") return C.amber;
  return C.green;
}
function statusLabel(status) {
  if (status === "critico") return "Crítico";
  if (status === "advertencia") return "Advertencia";
  return "Normal";
}

function buildInitialEnergyHistory() {
  const pts = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 15 * 60000);
    const wave = Math.sin((23 - i) / 3.5) * 12;
    const kw = 232 + wave + (Math.random() * 4 - 2);
    pts.push({
      time: t.toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" }),
      kw: Number(kw.toFixed(1)),
    });
  }
  return pts;
}

function buildInitialLog() {
  const now = Date.now();
  return [
    { id: 1, ts: now - 1000 * 60 * 3, rack: 12, level: "critico", msg: "Hotspot inminente detectado — nivel medio" },
    { id: 2, ts: now - 1000 * 60 * 18, rack: 6, level: "advertencia", msg: "Temperatura elevada — nivel superior" },
    { id: 3, ts: now - 1000 * 60 * 32, rack: 18, level: "advertencia", msg: "Flujo de aire reducido detectado" },
    { id: 4, ts: now - 1000 * 60 * 60 * 2, rack: 12, level: "info", msg: "Comando PWM 60% enviado a actuador" },
    { id: 5, ts: now - 1000 * 60 * 60 * 5, rack: 9, level: "normal", msg: "Rack normalizado tras acción correctiva" },
    { id: 6, ts: now - 1000 * 60 * 60 * 26, rack: 3, level: "advertencia", msg: "Pico de consumo energético registrado" },
    { id: 7, ts: now - 1000 * 60 * 60 * 70, rack: 21, level: "critico", msg: "Apagado preventivo evitado por acción de IA" },
  ];
}

// ---------- Small UI pieces ----------
function Pill({ status }) {
  const color = statusColor(status);
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700,
        letterSpacing: 0.4, padding: "3px 9px", borderRadius: 999, color,
        background: color + "22", border: `1px solid ${color}55`, textTransform: "uppercase",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color }} />
      {statusLabel(status)}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, pillStatus, accent }) {
  return (
    <div
      style={{
        background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: C.textSecondary, textTransform: "uppercase" }}>
          {label}
        </span>
        <Icon size={18} color={accent} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.textSecondary }}>{sub}</div>
      <Pill status={pillStatus} />
    </div>
  );
}

function RackCell({ rack, onClick }) {
  const color = statusColor(rack.status);
  const critical = rack.status === "critico";
  return (
    <button
      onClick={() => onClick(rack)}
      style={{
        background: critical ? color + "1E" : C.panelAlt,
        border: `1.5px solid ${critical ? color : C.border}`,
        borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "center",
        transition: "transform 120ms ease, border-color 200ms ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ fontSize: 10, color: C.textSecondary, marginBottom: 4 }}>{rack.label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{rack.temp.toFixed(1)}°</div>
    </button>
  );
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        background: "transparent", border: "none", cursor: "pointer",
        color: active ? C.green : C.textSecondary, padding: "6px 10px", flex: 1,
      }}
    >
      <Icon size={18} />
      <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
    </button>
  );
}

function TopTab({ n, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? C.panelAlt : "transparent",
        border: `1px solid ${active ? C.green + "55" : "transparent"}`,
        color: active ? C.green : C.textSecondary, borderRadius: 8, padding: "6px 14px",
        fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", gap: 6, alignItems: "center",
      }}
    >
      <span style={{ opacity: 0.6 }}>{n}</span>{label}
    </button>
  );
}

// ---------- Main App ----------
export default function GreenRackAI() {
  const [racks, setRacks] = useState(buildInitialRacks);
  const [energyHistory, setEnergyHistory] = useState(buildInitialEnergyHistory);
  const [log, setLog] = useState(buildInitialLog);
  const [view, setView] = useState("dashboard");
  const [selectedRackNum, setSelectedRackNum] = useState(12);
  const [now, setNow] = useState(new Date());
  const [historyFilter, setHistoryFilter] = useState("24h");
  const logIdRef = useRef(100);

  const selectedRack = racks.find((r) => r.num === selectedRackNum) || racks[0];

  // clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // live simulation
  useEffect(() => {
    const t = setInterval(() => {
      setRacks((prev) =>
        prev.map((r) => {
          const drift = (Math.random() - 0.5) * 0.4;
          const cooling = (r.pwm - 50) * 0.006;
          let temp = r.temp + drift - cooling;
          temp = Math.max(20, Math.min(30, temp));
          let status = "normal";
          if (temp >= 27) status = "critico";
          else if (temp >= 25.2) status = "advertencia";
          return { ...r, temp: Number(temp.toFixed(1)), status };
        })
      );
      setEnergyHistory((prev) => {
        const last = prev[prev.length - 1];
        const wave = Math.sin(Date.now() / 90000) * 10;
        const kw = Math.max(200, 232 + wave + (Math.random() * 5 - 2.5));
        const next = [
          ...prev.slice(1),
          { time: new Date().toLocaleTimeString("es-SV", { hour: "2-digit", minute: "2-digit" }), kw: Number(kw.toFixed(1)) },
        ];
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const alerts = useMemo(
    () => racks.filter((r) => r.status !== "normal").sort((a, b) => b.temp - a.temp),
    [racks]
  );
  const normalCount = racks.filter((r) => r.status === "normal").length;
  const advertenciaCount = racks.filter((r) => r.status === "advertencia").length;
  const avgTemp = racks.reduce((s, r) => s + r.temp, 0) / racks.length;
  const totalKw = energyHistory[energyHistory.length - 1]?.kw ?? 245.6;
  const pue = (1.02 + (totalKw - 220) / 900).toFixed(2);
  const hotspotsMitigados = 127;

  function pushLog(entry) {
    logIdRef.current += 1;
    setLog((prev) => [{ id: logIdRef.current, ts: Date.now(), ...entry }, ...prev]);
  }

  function sendCommand(rackNum, pwm) {
    setRacks((prev) => prev.map((r) => (r.num === rackNum ? { ...r, pwm } : r)));
    pushLog({ rack: rackNum, level: "info", msg: `Comando PWM ${pwm}% enviado a actuador del rack #${String(rackNum).padStart(2, "0")}` });
  }

  function openRack(rack) {
    setSelectedRackNum(rack.num);
    setView("rack");
  }

  const dateStr = now.toLocaleDateString("es-SV", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("es-SV", { hour12: false });

  return (
    <div style={{ background: C.bg, minHeight: 600, borderRadius: 16, padding: "18px 18px 90px", fontFamily: "Inter, system-ui, sans-serif", color: C.textPrimary }}>
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#04342C" }}>
            GR
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>GreenRack AI</div>
            <div style={{ fontSize: 11, color: C.textSecondary }}>Dashboard — Centro de Datos</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.green, fontVariantNumeric: "tabular-nums" }}>{timeStr}</div>
          <div style={{ fontSize: 11, color: C.textSecondary, textTransform: "capitalize" }}>{dateStr}</div>
        </div>
      </div>

      {/* Desktop tabs */}
      <div className="grk-desktop-tabs" style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <TopTab n={1} label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
        <TopTab n={2} label={selectedRack.label} active={view === "rack"} onClick={() => setView("rack")} />
        <TopTab n={3} label="Predictivo" active={view === "predictivo"} onClick={() => setView("predictivo")} />
        <TopTab n={4} label="Historial" active={view === "historial"} onClick={() => setView("historial")} />
      </div>

      {view === "dashboard" && (
        <Dashboard
          racks={racks} alerts={alerts} energyHistory={energyHistory} avgTemp={avgTemp}
          normalCount={normalCount} advertenciaCount={advertenciaCount} pue={pue} totalKw={totalKw}
          hotspotsMitigados={hotspotsMitigados} onOpenRack={openRack}
        />
      )}
      {view === "rack" && (
        <RackDetail rack={selectedRack} onBack={() => setView("dashboard")} onSendCommand={sendCommand} />
      )}
      {view === "predictivo" && <Predictivo racks={racks} selectedRack={selectedRack} onSelect={setSelectedRackNum} />}
      {view === "historial" && <Historial log={log} filter={historyFilter} setFilter={setHistoryFilter} />}

      {/* Mobile bottom nav */}
      <div
        className="grk-mobile-nav"
        style={{
          position: "absolute", left: 12, right: 12, bottom: 12, background: C.panel,
          border: `1px solid ${C.border}`, borderRadius: 14, display: "flex", padding: "6px 4px",
        }}
      >
        <NavItem icon={Home} label="Dashboard" active={view === "dashboard"} onClick={() => setView("dashboard")} />
        <NavItem icon={Server} label={`Rack #${String(selectedRack.num).padStart(2, "0")}`} active={view === "rack"} onClick={() => setView("rack")} />
        <NavItem icon={TrendingUp} label="Predictivo" active={view === "predictivo"} onClick={() => setView("predictivo")} />
        <NavItem icon={History} label="Historial" active={view === "historial"} onClick={() => setView("historial")} />
      </div>

      <style>{`
        @media (min-width: 900px) { .grk-mobile-nav { display: none; } }
        @media (max-width: 899px) { .grk-desktop-tabs { display: none; } }
      `}</style>
    </div>
  );
}

// ---------- Dashboard view ----------
function Dashboard({ racks, alerts, energyHistory, avgTemp, normalCount, advertenciaCount, pue, totalKw, hotspotsMitigados, onOpenRack }) {
  const criticoCount = racks.filter((r) => r.status === "critico").length;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 16 }} className="grk-kpi-grid">
        <KpiCard icon={Zap} label="PUE Promedio" value={pue} sub="Eficiencia energética" pillStatus="normal" accent={C.green} />
        <KpiCard icon={Battery} label="Consumo Energético Total" value={`${totalKw.toFixed(1)} kW`} sub="Tendencia estable" pillStatus="normal" accent={C.green} />
        <KpiCard icon={Bell} label="Alertas Activas" value={alerts.length} sub={`${criticoCount} crítica, ${advertenciaCount} advertencias`} pillStatus="critico" accent={C.red} />
        <KpiCard icon={ShieldCheck} label="Hotspots Mitigados" value={`${hotspotsMitigados} este mes`} sub="↑ 14 esta semana" pillStatus="normal" accent={C.green} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }} className="grk-main-grid">
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Mapa de Sala — Piso Principal</div>
          <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 12 }}>24 racks monitoreados · Haga clic para ver detalle</div>
          {PASILLOS.map((p, colIdx) => null)}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 6 }}>
            {PASILLOS.map((p) => (
              <div key={p} style={{ fontSize: 10, color: C.textSecondary, textAlign: "center", fontWeight: 700 }}>PASILLO {p}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {racks.map((r) => (
              <RackCell key={r.id} rack={r} onClick={onOpenRack} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap" }}>
            <Legend color={C.green} label="Normal" />
            <Legend color={C.amber} label="Advertencia" />
            <Legend color={C.red} label="Alerta" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16, borderTop: `1px solid ${C.border}`, paddingTop: 12 }}>
            <Stat label="Racks Normales" value={normalCount} color={C.green} />
            <Stat label="En Advertencia" value={advertenciaCount} color={C.amber} />
            <Stat label="Temp. Promedio" value={`${avgTemp.toFixed(1)}°C`} color={C.textPrimary} />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Tendencia Energética</div>
            <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 8 }}>Últimas 6 horas · kW</div>
            <div style={{ height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={energyHistory}>
                  <defs>
                    <linearGradient id="grkArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.green} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={C.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
                  <Tooltip contentStyle={{ background: C.panelAlt, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.textSecondary }} />
                  <Area type="monotone" dataKey="kw" stroke={C.green} strokeWidth={2} fill="url(#grkArea)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={14} color={C.red} /> Alertas Activas
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {alerts.length === 0 && <div style={{ fontSize: 12, color: C.textSecondary }}>Sin alertas activas.</div>}
              {alerts.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onOpenRack(r)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, background: "transparent",
                    border: "none", borderLeft: `3px solid ${statusColor(r.status)}`, padding: "6px 0 6px 10px",
                    textAlign: "left", cursor: "pointer",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: statusColor(r.status) }}>{r.label}</div>
                    <div style={{ fontSize: 11, color: C.textSecondary }}>
                      {r.status === "critico" ? "Hotspot inminente — nivel medio" : "Temperatura elevada"} · {r.temp.toFixed(1)}°C
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (min-width: 900px) { .grk-kpi-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        @media (max-width: 899px) { .grk-main-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: C.textSecondary }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color }} /> {label}
    </div>
  );
}
function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: C.textSecondary, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// ---------- Rack detail view ----------
function RackDetail({ rack, onBack, onSendCommand }) {
  const [pwm, setPwm] = useState(rack.pwm);
  const [sentMsg, setSentMsg] = useState("");
  useEffect(() => setPwm(rack.pwm), [rack.id]);

  const levels = [
    { label: "Nivel Superior", temp: (rack.temp + 1.1).toFixed(1) },
    { label: "Nivel Medio", temp: rack.temp.toFixed(1) },
    { label: "Nivel Inferior", temp: (rack.temp - 0.8).toFixed(1) },
  ];

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none", color: C.textSecondary, cursor: "pointer", marginBottom: 12, fontSize: 12 }}>
        <ChevronLeft size={16} /> Volver al dashboard
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{rack.label} — Pasillo {rack.pasillo}, Fila {rack.fila}</div>
          <div style={{ fontSize: 12, color: C.textSecondary }}>Sensores IoT de 3 niveles · Actuador PWM local</div>
        </div>
        <Pill status={rack.status} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {levels.map((l) => (
          <div key={l.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 6 }}>{l.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              <Thermometer size={16} color={statusColor(rack.status)} /> {l.temp}°C
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <Activity size={14} color={C.green} /> Control de Actuador — Ventilador PWM
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <input type="range" min={0} max={100} value={pwm} onChange={(e) => setPwm(Number(e.target.value))} style={{ flex: 1 }} />
          <span style={{ fontSize: 14, fontWeight: 700, minWidth: 44 }}>{pwm}%</span>
        </div>
        <button
          onClick={() => {
            onSendCommand(rack.num, pwm);
            setSentMsg(`Comando enviado: velocidad de ventilador ajustada a ${pwm}%.`);
            setTimeout(() => setSentMsg(""), 3000);
          }}
          style={{ display: "flex", alignItems: "center", gap: 6, background: C.green, color: "#04342C", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          <Send size={14} /> Enviar comando a Arduino
        </button>
        {sentMsg && <div style={{ fontSize: 11, color: C.green, marginTop: 8 }}>{sentMsg}</div>}
      </div>
    </div>
  );
}

// ---------- Predictivo view ----------
function Predictivo({ racks, selectedRack, onSelect }) {

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {

    async function getPrediction() {

      setLoading(true);
      setError("");

      try {

        const response = await fetch(
          `http://localhost:4000/api/ai/predict/${selectedRack.num}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              temperature: selectedRack.temp,
              humidity: 48,
              cpu_load: 78,
              airflow: selectedRack.pwm,
              power_kw: 245,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Error HTTP ${response.status}`
          );
        }

        const data = await response.json();

        setPrediction(data);

      } catch (err) {

        console.error(
          "Error obteniendo predicción:",
          err
        );

        setError(
          "No fue posible obtener la predicción del servicio de IA."
        );

      } finally {

        setLoading(false);

      }
    }

    getPrediction();

  }, [
    selectedRack.num,
    selectedRack.temp,
    selectedRack.pwm
  ]);


  const risk = prediction
    ? prediction.risk_percentage
    : 0;

  const riskColor =
    risk >= 70
      ? C.red
      : risk >= 40
        ? C.amber
        : C.green;


  const forecast = prediction
    ? [
        {
          min: "Actual",
          temp: Number(
            selectedRack.temp.toFixed(1)
          ),
        },
        {
          min: "+15m",
          temp: prediction.prediction_temperature_c,
        },
      ]
    : [
        {
          min: "Actual",
          temp: selectedRack.temp,
        },
      ];


  const ranked = [...racks]
    .sort((a, b) => b.temp - a.temp)
    .slice(0, 6);


  return (

    <div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 2,
        }}
      >
        Predicción de Hotspots — LSTM + XGBoost
      </div>

      <div
        style={{
          fontSize: 11,
          color: C.textSecondary,
          marginBottom: 14,
        }}
      >
        Predicción mediante modelos de IA a 15 minutos
      </div>


      {error && (

        <div
          style={{
            background: C.red + "18",
            border: `1px solid ${C.red}55`,
            color: C.red,
            borderRadius: 10,
            padding: 10,
            marginBottom: 12,
            fontSize: 12,
          }}
        >
          {error}
        </div>

      )}


      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: 12,
        }}
        className="grk-pred-grid"
      >


        {/* ------------------------------------------------ */}
        {/* GRÁFICA */}
        {/* ------------------------------------------------ */}

        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 16,
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
            }}
          >

            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Pronóstico — {selectedRack.label}
            </span>


            <select
              value={selectedRack.num}
              onChange={(e) =>
                onSelect(
                  Number(e.target.value)
                )
              }
              style={{
                background: C.panelAlt,
                color: C.textPrimary,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                fontSize: 12,
                padding: "4px 8px",
              }}
            >

              {racks.map((r) => (

                <option
                  key={r.id}
                  value={r.num}
                >
                  {r.label}
                </option>

              ))}

            </select>

          </div>


          {loading ? (

            <div
              style={{
                height: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.textSecondary,
                fontSize: 12,
              }}
            >
              Ejecutando modelos XGBoost + LSTM...
            </div>

          ) : (

            <div style={{ height: 200 }}>

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <LineChart
                  data={forecast}
                >

                  <CartesianGrid
                    stroke={C.border}
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="min"
                    tick={{
                      fill: C.textSecondary,
                      fontSize: 11,
                    }}
                  />

                  <YAxis
                    tick={{
                      fill: C.textSecondary,
                      fontSize: 11,
                    }}
                    domain={[
                      "dataMin - 1",
                      "dataMax + 1",
                    ]}
                  />

                  <ReferenceLine
                    y={27}
                    stroke={C.red}
                    strokeDasharray="4 4"
                    label={{
                      value: "Umbral crítico",
                      fill: C.red,
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />

                  <Tooltip
                    contentStyle={{
                      background: C.panelAlt,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="temp"
                    stroke={C.green}
                    strokeWidth={2}
                    dot
                  />

                </LineChart>

              </ResponsiveContainer>

            </div>

          )}

        </div>


        {/* ------------------------------------------------ */}
        {/* INFORMACIÓN DE IA */}
        {/* ------------------------------------------------ */}

        <div
          style={{
            background: C.panel,
            border: `1px solid ${C.border}`,
            borderRadius: 14,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >

          <div>

            <div
              style={{
                fontSize: 11,
                color: C.textSecondary,
                marginBottom: 6,
              }}
            >
              Riesgo térmico (15 min)
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: riskColor,
              }}
            >
              {loading
                ? "..."
                : `${risk}%`}
            </div>

            <div
              style={{
                height: 6,
                background: C.panelAlt,
                borderRadius: 999,
                marginTop: 8,
                overflow: "hidden",
              }}
            >

              <div
                style={{
                  width: `${risk}%`,
                  height: "100%",
                  background: riskColor,
                }}
              />

            </div>

          </div>


          {/* ------------------------------------------------ */}
          {/* PREDICCIONES */}
          {/* ------------------------------------------------ */}

          {prediction && (

            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 12,
              }}
            >

              <div
                style={{
                  fontSize: 11,
                  color: C.textSecondary,
                  marginBottom: 8,
                }}
              >
                Resultado de modelos
              </div>


              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                  fontSize: 12,
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    XGBoost
                  </span>

                  <strong>
                    {prediction.xgboost_prediction_c}°C
                  </strong>
                </div>


                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    LSTM
                  </span>

                  <strong>
                    {prediction.lstm_prediction_c}°C
                  </strong>
                </div>


                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: C.green,
                  }}
                >
                  <span>
                    Ensamble
                  </span>

                  <strong>
                    {prediction.prediction_temperature_c}°C
                  </strong>
                </div>

              </div>

            </div>

          )}


          {/* ------------------------------------------------ */}
          {/* RECOMENDACIÓN */}
          {/* ------------------------------------------------ */}

          {prediction && (

            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 12,
              }}
            >

              <div
                style={{
                  fontSize: 11,
                  color: C.textSecondary,
                  marginBottom: 6,
                }}
              >
                Recomendación de IA
              </div>

              <div
                style={{
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: C.textPrimary,
                }}
              >
                {prediction.recommendation}
              </div>

            </div>

          )}


          {/* ------------------------------------------------ */}
          {/* RACKS PRIORIZADOS */}
          {/* ------------------------------------------------ */}

          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              paddingTop: 12,
            }}
          >

            <div
              style={{
                fontSize: 11,
                color: C.textSecondary,
                marginBottom: 8,
              }}
            >
              Racks priorizados
            </div>


            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >

              {ranked.map((r) => (

                <button
                  key={r.id}
                  onClick={() =>
                    onSelect(r.num)
                  }
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    background:
                      r.num === selectedRack.num
                        ? C.panelAlt
                        : "transparent",
                    border: "none",
                    borderRadius: 6,
                    padding: "5px 8px",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >

                  <span
                    style={{
                      color: C.textPrimary,
                    }}
                  >
                    {r.label}
                  </span>

                  <span
                    style={{
                      color:
                        statusColor(
                          r.status
                        ),
                      fontWeight: 700,
                    }}
                  >
                    {r.temp.toFixed(1)}°
                  </span>

                </button>

              ))}

            </div>

          </div>

        </div>

      </div>


      <style>{`
        @media (max-width: 899px) {
          .grk-pred-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

    </div>
  );
}

// ---------- Historial view ----------
function Historial({ log, filter, setFilter }) {
  const now = Date.now();
  const windowMs = filter === "24h" ? 1000 * 60 * 60 * 24 : filter === "7d" ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 24 * 30;
  const filtered = log.filter((e) => now - e.ts <= windowMs);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Historial de Eventos</div>
          <div style={{ fontSize: 11, color: C.textSecondary }}>Registro de alertas, comandos y acciones del sistema</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px" }}>
          <Calendar size={14} color={C.textSecondary} />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ background: "transparent", color: C.textPrimary, border: "none", fontSize: 12 }}>
            <option value="24h">Últimas 24h</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
          </select>
        </div>
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {filtered.length === 0 && <div style={{ padding: 16, fontSize: 12, color: C.textSecondary }}>Sin eventos en este período.</div>}
        {filtered.map((e, i) => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
            {e.level === "critico" ? <AlertTriangle size={15} color={C.red} /> : e.level === "advertencia" ? <AlertTriangle size={15} color={C.amber} /> : <CheckCircle2 size={15} color={C.green} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.textPrimary }}>{e.msg}</div>
              <div style={{ fontSize: 11, color: C.textSecondary }}>Rack #{String(e.rack).padStart(2, "0")}</div>
            </div>
            <div style={{ fontSize: 11, color: C.textSecondary, whiteSpace: "nowrap" }}>
              {new Date(e.ts).toLocaleString("es-SV", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
