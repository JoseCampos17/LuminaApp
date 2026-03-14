import { invoke } from "$lib/tauri";
import { NOTIFICATION_LABELS } from "$lib/logic/NotificationService.svelte";
import type { NotificationSetting } from "$lib/logic/NotificationService.svelte";

export class NotificationSettingsState {
  settings = $state<NotificationSetting[]>([]);
  isLoading = $state(true);

  constructor() {
    this.load();
  }

  load = async () => {
    this.isLoading = true;
    try {
      const data: NotificationSetting[] = await invoke("get_notification_settings");
      this.settings = data;
    } catch (e) {
      console.error("Failed to load notification settings", e);
    } finally {
      this.isLoading = false;
    }
  };

  toggle = async (key: string) => {
    const setting = this.settings.find(s => s.key === key);
    if (!setting) return;
    const newValue = !setting.enabled;
    // Optimistically update UI
    setting.enabled = newValue;
    await invoke("update_notification_setting", { key, enabled: newValue });
  };

  getLabel(key: string) {
    return NOTIFICATION_LABELS[key] ?? { label: key, description: "" };
  }
}
