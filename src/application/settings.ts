import type { Clock, LocalStore } from './ports';

export type Hand = 'right' | 'left';

/** This device's settings; they never sync (the computer has no hand to choose). */
export interface DeviceSettings {
  /** The hand that holds the phone: every control sits on its side (spec/modo-compra.md). */
  readonly hand: Hand;
  /** The setup was finished or skipped on this device. */
  readonly setupDone: boolean;
  readonly lastBackupAt: number | null;
  /** When the app first opened here; the backup reminder counts from it until the first backup. */
  readonly firstUseAt: number | null;
}

const DEFAULTS: DeviceSettings = { hand: 'right', setupDone: false, lastBackupAt: null, firstUseAt: null };
const KEYS = Object.keys(DEFAULTS) as (keyof DeviceSettings)[];

/** Reads the settings once, keeps them in memory and tells the screens when one changes. */
export class Settings {
  private state: DeviceSettings = DEFAULTS;
  private readonly listeners = new Set<() => void>();
  readonly ready: Promise<void>;

  constructor(
    private readonly store: LocalStore,
    clock: Clock,
  ) {
    this.ready = (async () => {
      const values = await Promise.all(KEYS.map((key) => store.getSetting(key)));
      const loaded = Object.fromEntries(KEYS.flatMap((key, i) => (values[i] === undefined ? [] : [[key, values[i]]])));
      this.state = { ...DEFAULTS, ...loaded };
      if (this.state.firstUseAt === null) await this.set('firstUseAt', clock.now());
      this.emit();
    })();
  }

  getState = (): DeviceSettings => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  async set<K extends keyof DeviceSettings>(key: K, value: DeviceSettings[K]): Promise<void> {
    this.state = { ...this.state, [key]: value };
    this.emit();
    await this.store.setSetting(key, value);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}
