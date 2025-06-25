interface EventMap {
  message_dispatched: { regenerate: boolean };
}

type EventKey = keyof EventMap;

type Listener<K extends EventKey> = (payload: EventMap[K]) => void;

type ListenersMap = {
  [K in EventKey]?: Set<Listener<K>>;
};

class EventDispatcher {
  private listeners: ListenersMap = {};

  public addListener<K extends EventKey>(eventName: K, listener: Listener<K>): () => void {
    if (!this.listeners[eventName]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.listeners as any)[eventName] = new Set();
    }
    const listenersForEvent = this.listeners[eventName] as Set<Listener<K>>;
    listenersForEvent.add(listener);

    return () => {
      this.removeListener(eventName, listener);
    };
  }

  public removeListener<K extends EventKey>(eventName: K, listener: Listener<K>): void {
    const listenersForEvent = this.listeners[eventName];
    if (listenersForEvent) {
      listenersForEvent.delete(listener);
      if (listenersForEvent.size === 0) {
        delete this.listeners[eventName];
      }
    }
  }

  public launch<K extends EventKey>(eventName: K, data: EventMap[K]): void {
    const listenersForEvent = this.listeners[eventName];
    if (listenersForEvent) {
      (listenersForEvent as Set<Listener<K>>).forEach((listener) => listener(data));
    }
  }
}

export const sendMessageEventDispatcher = new EventDispatcher();
