import json
import random
import time
import socket
import os
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
import psutil
from dotenv import load_dotenv

load_dotenv()

RACKS = [1, 6, 12, 18]

MQTT_BROKER = os.getenv("MQTT_BROKER", "127.0.0.1")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC = os.getenv(
    "MQTT_TOPIC",
    "greenrack/telemetry"
)


def get_cpu_load():
    return psutil.cpu_percent(interval=1)


def get_temperature():
    """
    Intenta obtener la temperatura real de la máquina.
    Si no está disponible, utiliza una temperatura simulada.
    """
    try:
        temps = psutil.sensors_temperatures()

        for entries in temps.values():
            if entries:
                for entry in entries:
                    if entry.current > 0:
                        return round(entry.current, 2)

    except Exception:
        pass

    return round(random.uniform(25.0, 29.0), 2)


def generate_telemetry(rack, cpu_load, temperature):
    humidity = round(random.uniform(42, 55), 2)

    airflow = round(
        max(
            40,
            min(
                90,
                75 - (cpu_load * 0.15) + random.uniform(-2, 2)
            )
        ),
        2
    )

    power_kw = round(
        max(
            120,
            min(
                270,
                175 + (cpu_load * 0.85) + random.uniform(-4, 4)
            )
        ),
        2
    )

    return {
        "device": socket.gethostname(),
        "rack": rack,
        "temperature": temperature,
        "humidity": humidity,
        "cpu_load": round(cpu_load, 2),
        "airflow": airflow,
        "power_kw": power_kw,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


def main():
    print("=" * 60)
    print(" GREENRACK AI - NODO IoT")
    print("=" * 60)
    print(f"Dispositivo: {socket.gethostname()}")
    print("Estado: ONLINE")
    print()

    mqtt_client = mqtt.Client(
        mqtt.CallbackAPIVersion.VERSION2,
        client_id="greenrack-iot-node"
    )

    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()

    print("MQTT: CONECTADO")
    print(f"Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"Topic: {MQTT_TOPIC}")
    print()

    try:
        while True:
            cpu_load = get_cpu_load()
            temperature = get_temperature()

            for rack in RACKS:
                telemetry = generate_telemetry(
                    rack,
                    cpu_load,
                    temperature
                )

                payload = json.dumps(telemetry)

                mqtt_client.publish(
                    MQTT_TOPIC,
                    payload
                )

                print(payload)
                print(f"MQTT → {MQTT_TOPIC}")
                print("-" * 60)

            time.sleep(5)

    except KeyboardInterrupt:
        print("\nDeteniendo nodo IoT...")

    finally:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
        print("MQTT: DESCONECTADO")


if __name__ == "__main__":
    main()