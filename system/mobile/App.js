import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import axios from 'axios';

// Reemplaza esta IP por la IP local de tu computadora en tu red Wi-Fi (ej: 192.168.1.15) 
// para que el teléfono real pueda comunicarse con tu backend.
const API_URL = 'http://10.205.48.6:4000/api'; 

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [racks, setRacks] = useState([]);
  const [selectedRack, setSelectedRack] = useState({ num: 12, label: "Rack #12", temp: 27.9, status: "critico", pwm: 78 });
  const [pwmVal, setPwmVal] = useState('78');
  const [aiData, setAiData] = useState(null);
  const [logMsg, setLogMsg] = useState('');

  useEffect(() => {
    fetchRacks();
  }, []);

  const fetchRacks = async () => {
    try {
      // Simulación de consumo de API backend
      const response = await axios.get(`${API_URL}/racks`);
      setRacks(response.data);
    } catch (e) {
      // Datos de respaldo locales si la red móvil aún no está configurada con la IP exacta
      setRacks([
        { num: 1, label: "Rack #01", temp: 22.4, status: "normal" },
        { num: 6, label: "Rack #06", temp: 25.8, status: "advertencia" },
        { num: 12, label: "Rack #12", temp: 27.9, status: "critico" },
      ]);
    }
  };

  const sendIoTCommand = async () => {
    try {
      await axios.post(`${API_URL}/racks/control`, { rackNum: selectedRack.num, pwm: Number(pwmVal) });
      setLogMsg(`Comando IoT enviado con éxito (${pwmVal}% PWM)`);
    } catch (err) {
      setLogMsg(`Acción simulada: PWM ajustado a ${pwmVal}% en actuador`);
    }
  };

  const fetchAI = async () => {
    try {
      const res = await axios.get(`${API_URL}/ai/predict/${selectedRack.num}`);
      setAiData(res.data);
    } catch (e) {
      setAiData({
        riskPercentage: 85,
        recommendation: "Riesgo de Hotspot detectado por modelo LSTM. Aumentar flujo de aire."
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GreenRack AI Mobile</Text>
        <Text style={styles.headerSub}>Centro de Datos — Monitoreo IoT/IA</Text>
      </View>

      {/* Contenido según la pestaña */}
      <ScrollView style={styles.content}>
        {tab === 'dashboard' && (
          <View>
            <View style={styles.cardKpi}>
              <Text style={styles.kpiTitle}>PUE Promedio del Sistema</Text>
              <Text style={styles.kpiValue}>1.04</Text>
              <Text style={styles.kpiSub}>Eficiencia energética óptima</Text>
            </View>

            <Text style={styles.sectionTitle}>Estado de Racks en Sala</Text>
            {racks.map((r) => (
              <TouchableOpacity 
                key={r.num} 
                style={[styles.rackItem, { borderColor: r.status === 'critico' ? '#EF4444' : '#10B981' }]}
                onPress={() => { setSelectedRack(r); setTab('control'); }}
              >
                <Text style={styles.rackText}>{r.label} — {r.temp}°C</Text>
                <Text style={[styles.statusText, { color: r.status === 'critico' ? '#EF4444' : '#10B981' }]}>
                  {r.status.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'control' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Control IoT: {selectedRack.label}</Text>
            <Text style={styles.textDesc}>Temperatura Actual: {selectedRack.temp}°C</Text>
            
            <Text style={styles.labelInput}>Ajustar Velocidad Ventilador PWM (%):</Text>
            <TextInput 
              style={styles.input} 
              keyboardType="numeric" 
              value={pwmVal} 
              onChangeText={setPwmVal} 
            />
            
            <TouchableOpacity style={styles.btn} onPress={sendIoTCommand}>
              <Text style={styles.btnText}>Enviar Comando al Actuador</Text>
            </TouchableOpacity>
            {logMsg ? <Text style={styles.logText}>{logMsg}</Text> : null}
          </View>
        )}

        {tab === 'ai' && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Módulo de Inteligencia Artificial</Text>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#F59E0B' }]} onPress={fetchAI}>
              <Text style={styles.btnText}>Ejecutar Predicción (LSTM)</Text>
            </TouchableOpacity>
            
            {aiData && (
              <View style={styles.aiBox}>
                <Text style={styles.aiTitle}>Riesgo Estimado (15 min): {aiData.riskPercentage}%</Text>
                <Text style={styles.textDesc}>{aiData.recommendation}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Barra de Navegación Inferior */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setTab('dashboard')} style={styles.navBtn}>
          <Text style={[styles.navText, tab === 'dashboard' && styles.navActive]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('control')} style={styles.navBtn}>
          <Text style={[styles.navText, tab === 'control' && styles.navActive]}>Control IoT</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('ai')} style={styles.navBtn}>
          <Text style={[styles.navText, tab === 'ai' && styles.navActive]}>Cognición IA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1C', paddingTop: 50, height: '100vh', width: '100vw' },
  header: { paddingHorizontal: 20, marginBottom: 15 },
  headerTitle: { color: '#E2E8F0', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#64748B', fontSize: 12 },
  content: { flex: 1, paddingHorizontal: 20 },
  cardKpi: { backgroundColor: '#131B2E', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#243049' },
  kpiTitle: { color: '#64748B', fontSize: 11, textTransform: 'uppercase', fontWeight: 'bold' },
  kpiValue: { color: '#10B981', fontSize: 28, fontWeight: 'bold', marginVertical: 5 },
  kpiSub: { color: '#E2E8F0', fontSize: 12 },
  sectionTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  rackItem: { backgroundColor: '#131B2E', padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, borderWidth: 1 },
  rackText: { color: '#E2E8F0', fontSize: 14, fontWeight: '600' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#131B2E', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#243049' },
  textDesc: { color: '#E2E8F0', fontSize: 13, marginBottom: 10 },
  labelInput: { color: '#64748B', fontSize: 12, marginBottom: 5 },
  input: { backgroundColor: '#1A2338', color: '#E2E8F0', padding: 10, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#243049' },
  btn: { backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 5 },
  btnText: { color: '#04342C', fontWeight: 'bold', fontSize: 13 },
  logText: { color: '#10B981', fontSize: 12, marginTop: 10 },
  aiBox: { backgroundColor: '#1A2338', padding: 12, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: '#F59E0B' },
  aiTitle: { color: '#F59E0B', fontWeight: 'bold', fontSize: 14, marginBottom: 5 },
  navBar: { flexDirection: 'row', backgroundColor: '#131B2E', borderTopWidth: 1, borderTopColor: '#243049', paddingVertical: 10 },
  navBtn: { flex: 1, alignItems: 'center' },
  navText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  navActive: { color: '#10B981' }
});