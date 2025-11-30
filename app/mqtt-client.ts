import mqtt, { MqttClient } from 'mqtt';

export const connectToBroker = (): MqttClient => {
  const url = process.env.NEXT_PUBLIC_HIVEMQ_WSS_URL || "wss://2faf87f825a94c9f9f4a0db4f9569ab6.s1.eu.hivemq.cloud:8884/mqtt";
  const username = process.env.NEXT_PUBLIC_HIVEMQ_USER || "hivemq.webclient.1764417700877";
  const password = process.env.NEXT_PUBLIC_HIVEMQ_PASS || "Tm1,0S5oP.4x<YE#hkGy";

  console.log('MQTT URL:', url);
  if (!url) throw new Error("MQTT Broker URL not defined in env");

  const client = mqtt.connect(url, {
    username,
    password,
    clientId: `web_client_${Math.random().toString(16).slice(2, 10)}`,
    clean: true,
    connectTimeout: 4000,
  });

  client.on('connect', () => {
    console.log('Connected to HiveMQ Cloud via WSS');
  });

  client.on('error', (err) => {
    console.error('MQTT Connection Error:', err);
  });

  return client;
};
