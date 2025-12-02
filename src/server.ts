import { Effect } from './values';

type StoredItem = {
  name: string;
  effectsArray: Effect[];
};

class LocalStorageDB {
  private key: string;
  private canUseStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

  constructor(key: string) {
    this.key = key;
    this.init();
  }

  private init() {
    if (!this.canUseStorage()) {
      return;
    }

    if (!window.localStorage.getItem(this.key)) {
      window.localStorage.setItem(this.key, JSON.stringify({ items: [] }));
    }
  }

  private read(): { items: StoredItem[] } {
    if (!this.canUseStorage()) {
      return { items: [] };
    }

    return JSON.parse(window.localStorage.getItem(this.key) || '{"items": []}');
  }

  private write(data: { items: StoredItem[] }) {
    if (!this.canUseStorage()) {
      return;
    }

    window.localStorage.setItem(this.key, JSON.stringify(data));
  }

  async saveItem(name: string, effectsArray: Effect[]) {
    const data = this.read();
    const existingItemIndex = data.items.findIndex((item) => item.name === name);

    if (existingItemIndex >= 0) {
      data.items[existingItemIndex].effectsArray = effectsArray;
    } else {
      data.items.push({ name, effectsArray });
    }

    this.write(data);
    return { status: 200, message: 'Item saved successfully' };
  }

  async loadItem(name: string): Promise<{ status: number; item?: StoredItem; message?: string }> {
    const data = this.read();
    const item = data.items.find((item) => item.name === name);
    if (!item) {
      return { status: 404, message: 'Item not found' };
    }
    return { status: 200, item };
  }

  async loadAllItems(): Promise<{ status: number; items: StoredItem[] }> {
    return { status: 200, items: this.read().items };
  }
}

export const db = new LocalStorageDB('dndData');
