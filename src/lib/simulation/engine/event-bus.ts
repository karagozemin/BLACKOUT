import type { Message, SimulationEvent } from "@/lib/simulation/types";

export class SimulationEventBus {
  private readonly events: SimulationEvent[] = [];
  private readonly messages: Message[] = [];

  publishEvent(event: SimulationEvent) {
    this.events.push(event);
  }

  publishMessage(message: Message) {
    this.messages.push(message);
  }

  flushEvents() {
    return [...this.events];
  }

  flushMessages() {
    return [...this.messages];
  }
}
