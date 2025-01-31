class LocalStorageDB {
  private key: string;

  constructor(key: string) {
    this.key = key;
    this.init();
  }

  private init() {
    if (!localStorage.getItem(this.key)) {
      localStorage.setItem(this.key, JSON.stringify({ items: [] }));
    }
  }

  private read(): { items: any[] } {
    return JSON.parse(localStorage.getItem(this.key) || '{"items": []}');
  }

  private write(data: { items: any[] }) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  async saveItem(name: string, effectsArray: any[]) {
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

  async loadItem(name: string) {
    const data = this.read();
    const item = data.items.find((item) => item.name === name);
    if (!item) {
      return { status: 404, message: 'Item not found' };
    }
    return { status: 200, item };
  }

  async loadAllItems() {
    return { status: 200, items: this.read().items };
  }
}

export const db = new LocalStorageDB('dndData');
