type AlertsPayload = {
  unreadEmails: number;
  urgentChecks: number;
  lowFuel: number;
  lowTankCount: number;
};

class AlertsPoller {
  private pollerId: NodeJS.Timeout | null = null;
  private onAlertsCb: ((p: AlertsPayload) => void) | null = null;

  start(intervalMs: number = 30000) {
    if (this.pollerId) {
      this.stop();
    }

    this.poll();
    this.pollerId = setInterval(() => this.poll(), intervalMs);
  }

  private async poll() {
    try {
      const token = localStorage.getItem('olivemanager_token');
      if (!token) return;

      const response = await fetch('/api/auth/alerts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (this.onAlertsCb) {
          this.onAlertsCb(data as AlertsPayload);
        }
      } else if (response.status === 401) {
        this.stop();
      }
    } catch (err) {
      console.error('Failed to poll alerts', err);
    }
  }

  onAlerts(cb: (p: AlertsPayload) => void) {
    this.onAlertsCb = cb;
  }

  stop() {
    if (this.pollerId) {
      clearInterval(this.pollerId);
      this.pollerId = null;
    }
  }
}

export const alertsPoller = new AlertsPoller();
export type { AlertsPayload };

