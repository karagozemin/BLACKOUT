import { connectAsync, type IClientOptions, type MqttClient } from "mqtt";

interface MqttTransportConfig {
  brokerUrl?: string;
  clientIdPrefix: string;
  username?: string;
  password?: string;
}

export class MqttTransport {
  private client: MqttClient | null = null;

  constructor(private readonly config: MqttTransportConfig) {}

  get enabled() {
    return Boolean(this.config.brokerUrl);
  }

  async connect() {
    if (!this.config.brokerUrl || this.client) {
      return;
    }

    const options: IClientOptions = {
      clientId: `${this.config.clientIdPrefix}-${Math.random().toString(16).slice(2, 10)}`,
      username: this.config.username,
      password: this.config.password,
      reconnectPeriod: 0,
      connectTimeout: 4_000
    };

    this.client = await connectAsync(this.config.brokerUrl, options);
  }

  async publishJson(topic: string, payload: unknown) {
    if (!this.enabled) {
      return false;
    }

    await this.connect();
    if (!this.client) {
      return false;
    }

    await this.client.publishAsync(topic, JSON.stringify(payload), {
      qos: 1,
      retain: false
    });

    return true;
  }

  async close() {
    if (!this.client) {
      return;
    }

    await this.client.endAsync(true);
    this.client = null;
  }
}

export function createMqttTransportFromEnv() {
  return new MqttTransport({
    brokerUrl: process.env.MQTT_BROKER_URL,
    clientIdPrefix: "blackout-mqtt",
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  });
}

export function createFoxMqTransportFromEnv() {
  return new MqttTransport({
    brokerUrl: process.env.FOXMQ_BROKER_URL,
    clientIdPrefix: "blackout-foxmq",
    username: process.env.FOXMQ_USERNAME,
    password: process.env.FOXMQ_PASSWORD
  });
}
