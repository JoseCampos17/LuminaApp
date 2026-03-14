import { invoke } from "$lib/tauri";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

export interface NotificationSetting {
  key: string;
  enabled: boolean;
}

/** Human-readable labels for each notification key */
export const NOTIFICATION_LABELS: Record<string, { label: string; description: string }> = {
  liquidity_warning: {
    label: "⚠️ Liquidez Baja",
    description: "Alerta cuando tu presupuesto disponible baja del 30%.",
  },
  liquidity_critical: {
    label: "🚨 Presupuesto Agotado",
    description: "Alerta crítica cuando la liquidez baja del 10%.",
  },
  salary_day: {
    label: "💰 Inicio de Quincena",
    description: "Recordatorio al inicio de cada período (día 1 y día 16).",
  },
  recurring_due_soon: {
    label: "📅 Gasto Fijo Próximo",
    description: "Aviso cuando un gasto fijo vence en los próximos 3 días.",
  },
  overspent: {
    label: "📉 Sobregasto Detectado",
    description: "Alerta cuando los gastos variables superan tu ingreso neto.",
  },
};

class NotificationService {
  private settings: Map<string, boolean> = new Map();
  private loaded = false;
  /** Cached permission status. null = not checked yet. */
  private permissionGranted: boolean | null = null;

  /**
   * Call this once on app startup. If the OS permission has not been granted,
   * it immediately shows the system permission dialog.
   * This is a no-op in the browser or if permission is already granted.
   */
  async requestPermissionOnStartup() {
    await this.ensurePermission();
  }

  async load() {
    try {
      const data: NotificationSetting[] = await invoke("get_notification_settings");
      this.settings.clear();
      for (const s of data) {
        this.settings.set(s.key, s.enabled);
      }
      this.loaded = true;
    } catch (e) {
      console.error("Failed to load notification settings", e);
    }
  }

  isEnabled(key: string): boolean {
    return this.settings.get(key) ?? true;
  }

  async setEnabled(key: string, enabled: boolean) {
    this.settings.set(key, enabled);
    await invoke("update_notification_setting", { key, enabled });
  }

  getAll(): NotificationSetting[] {
    return Array.from(this.settings.entries()).map(([key, enabled]) => ({ key, enabled }));
  }

  /**
   * Ensures we have OS notification permission.
   * On Android 13+ this shows the system permission dialog on first use.
   * Returns true if we can send notifications, false otherwise.
   */
  private async ensurePermission(): Promise<boolean> {
    if (this.permissionGranted !== null) return this.permissionGranted;

    try {
      let granted = await isPermissionGranted();
      if (!granted) {
        const result = await requestPermission();
        granted = result === "granted";
      }
      this.permissionGranted = granted;
      return granted;
    } catch {
      // Running in browser or unsupported env — silently skip
      this.permissionGranted = false;
      return false;
    }
  }

  /** Evaluate financial state and fire relevant notifications. */
  async checkAndNotify(params: {
    liquidityPercent: number; // 0–100
    netIncome: number;
    variableExpenses: number;
    recurringExpenses: { description: string; frequency: string; day_of_month?: number | null }[];
  }) {
    if (!this.loaded) await this.load();

    const { liquidityPercent, netIncome, variableExpenses, recurringExpenses } = params;

    // --- Liquidity Warning (30%) ---
    if (this.isEnabled("liquidity_warning") && liquidityPercent <= 30 && liquidityPercent > 10) {
      await this.fire(
        "⚠️ Liquidez en Riesgo",
        `Tu presupuesto disponible está al ${liquidityPercent.toFixed(0)}%. Cuida tus gastos.`,
      );
    }

    // --- Liquidity Critical (10%) ---
    if (this.isEnabled("liquidity_critical") && liquidityPercent <= 10) {
      await this.fire(
        "🚨 Presupuesto Agotado",
        `Solo te queda el ${liquidityPercent.toFixed(0)}% de tu presupuesto. ¡Stop!`,
      );
    }

    // --- Overspent ---
    if (this.isEnabled("overspent") && variableExpenses > netIncome && netIncome > 0) {
      await this.fire(
        "📉 Sobregasto Detectado",
        "Has gastado más de lo que tienes disponible en este período.",
      );
    }

    // --- Salary Day ---
    if (this.isEnabled("salary_day")) {
      const today = new Date().getDate();
      if (today === 1 || today === 16) {
        await this.fire(
          "💰 ¡Inicio de Quincena!",
          "Tu período financiero se ha reiniciado. ¡Buen comienzo!",
        );
      }
    }

    // --- Recurring Due Soon ---
    if (this.isEnabled("recurring_due_soon")) {
      const today = new Date().getDate();
      for (const exp of recurringExpenses) {
        if (exp.frequency === "monthly" && exp.day_of_month != null) {
          const diff = exp.day_of_month - today;
          if (diff >= 0 && diff <= 3) {
            await this.fire(
              "📅 Gasto Fijo Próximo",
              `"${exp.description}" vence ${diff === 0 ? "hoy" : `en ${diff} día(s)`}.`,
            );
          }
        }
      }
    }
  }

  private async fire(title: string, body: string) {
    const permitted = await this.ensurePermission();
    if (!permitted) return;

    try {
      // Use native plugin directly — works on Windows, Android, macOS, iOS
      sendNotification({ title, body });
    } catch (e) {
      // Fallback to Rust command if JS plugin fails (older Tauri setup)
      try {
        await invoke("send_notification", { title, body });
      } catch {
        // Browser env or unsupported — silently no-op
      }
    }
  }
}

// Singleton export
export const notificationService = new NotificationService();
