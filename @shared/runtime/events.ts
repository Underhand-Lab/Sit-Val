type Handler<T = unknown> = (payload: T) => void;

const listeners = new Map<string, Set<Handler>>();

export const runtimeEvents = {
  emit<T = unknown>(name: string, payload?: T) {
    const handlers = listeners.get(name);
    if (!handlers) return;
    handlers.forEach((handler) => handler(payload as T));
  },
  on<T = unknown>(name: string, handler: Handler<T>) {
    const handlers = listeners.get(name) ?? new Set<Handler>();
    handlers.add(handler as Handler);
    listeners.set(name, handlers);
    return () => {
      handlers.delete(handler as Handler);
      if (handlers.size === 0) listeners.delete(name);
    };
  }
};
