type AlertsPayload = {
  unreadEmails: number;
  urgentChecks: number;
  lowFuel: number;
  lowTankCount: number;
};

class WebsocketService {
  private socket: WebSocket | null = null;
  private onAlertsCb: ((p: AlertsPayload) => void) | null = null;
  private onErrorCb: ((err: any) => void) | null = null;
  private onMaxRetriesCb: (() => void) | null = null;
  private retryCount = 0;
  private maxRetries = 5;

  connect(token?: string, maxRetries: number = 5) {
    if (this.socket) {
      this.disconnect();
    }

    this.maxRetries = maxRetries;
    const env = (import.meta as any).env || {};
    const wsUrl = (env.VITE_WS_URL as string) || 'ws://localhost:8080/ws/alerts';
    const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

    try {
      this.socket = new WebSocket(url);
      this.socket.onopen = () => {
        this.retryCount = 0;
        console.info('WebSocket connected');
      };
      this.socket.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          if (this.onAlertsCb) this.onAlertsCb(parsed as AlertsPayload);
        } catch (e) {
          console.warn('Failed to parse WS message', e);
        }
      };
      this.socket.onclose = (ev) => {
        console.warn('WebSocket closed', ev);
        if (this.retryCount < this.maxRetries) {
          this.retryCount++;
          const backoff = Math.min(1000 * 2 ** this.retryCount, 15000);
          setTimeout(() => {
            const tokenStored = window.localStorage.getItem('olivemanager_token') || undefined;
            this.connect(tokenStored, this.maxRetries);
          }, backoff);
        } else {
          if (this.onMaxRetriesCb) this.onMaxRetriesCb();
        }
      };
      this.socket.onerror = (err) => {
        console.error('WebSocket error', err);
        if (this.onErrorCb) this.onErrorCb(err);
      };
    } catch (err) {
      console.error('WS connection failed', err);
      if (this.onErrorCb) this.onErrorCb(err);
    }
  }

  onAlerts(cb: (p: AlertsPayload) => void) {
    this.onAlertsCb = cb;
  }

  onError(cb: (err: any) => void) {
    this.onErrorCb = cb;
  }

  onMaxRetries(cb: () => void) {
    this.onMaxRetriesCb = cb;
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const websocketService = new WebsocketService();
export type { AlertsPayload };
