import { normalizeHashtag } from './hashtag';
import type { Channel, Contact, Radio, RadioEvent, SelfInfo } from './types';

const now = () => Math.floor(Date.now() / 1000);
const fakeKey = (seed: number) => Array.from({ length: 32 }, (_, i) => ((seed * 31 + i * 17) % 256).toString(16).padStart(2, '0')).join('');

const CONDITIONS = ['Sunny', 'Partly Cloudy', 'Light Rain', 'Clear', 'Mostly Cloudy'];

/** In-memory radio used with ?demo=1 so the UI can be explored and tested without hardware. */
export class DemoRadio implements Radio {
  readonly transport = 'demo' as const;
  private readonly listeners = new Set<(event: RadioEvent) => void>();
  private name = 'Liberty Base';
  private channels: Channel[] = [{ idx: 0, name: 'Public' }];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private readonly contacts: Contact[] = [
    { publicKey: fakeKey(1), name: 'Eagle Ridge RPT', kind: 'repeater', lastAdvert: now() - 120, hops: 1 },
    { publicKey: fakeKey(2), name: 'Sam (Mobile)', kind: 'chat', lastAdvert: now() - 900, hops: 2 },
    { publicKey: fakeKey(3), name: 'Old Glory Room', kind: 'room', lastAdvert: now() - 7200, hops: null },
    { publicKey: fakeKey(4), name: 'WX-Bot', kind: 'chat', lastAdvert: now() - 60, hops: 1 },
  ];

  constructor(private readonly replyDelayMs = 1200) {
    this.later(1500, () => this.emitChannel(0, 'Sam (Mobile): Good morning mesh! Anyone copy?'));
  }

  on(listener: (event: RadioEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: RadioEvent) {
    for (const l of this.listeners) l(event);
  }

  private later(ms: number, fn: () => void) {
    this.timers.push(setTimeout(fn, ms));
  }

  private emitChannel(idx: number, text: string) {
    this.emit({ type: 'message', message: { kind: 'channel', channelIdx: idx, text, ts: now(), hops: 1, snr: 7.5 } });
  }

  async getSelfInfo(): Promise<SelfInfo> {
    return { name: this.name, publicKey: fakeKey(99), txPower: 20, maxTxPower: 22, radioFreq: 910.525, radioBw: 62.5, radioSf: 7, radioCr: 5 };
  }
  async getDeviceInfo() {
    return { firmware: 'v1.9.0 (demo)', model: 'Demo Radio' };
  }
  async getBatteryMv() {
    return 3980;
  }
  async getContacts() {
    return [...this.contacts];
  }
  async getChannels() {
    return [...this.channels];
  }
  async ensureHashtagChannel(name: string): Promise<Channel> {
    const tag = normalizeHashtag(name);
    const found = this.channels.find((c) => c.name.toLowerCase() === tag);
    if (found) return found;
    const channel = { idx: this.channels.length, name: tag };
    this.channels.push(channel);
    return channel;
  }
  async sendDirect(publicKeyHex: string, text: string) {
    const contact = this.contacts.find((c) => c.publicKey === publicKeyHex);
    if (contact?.kind === 'chat') {
      this.later(this.replyDelayMs, () =>
        this.emit({ type: 'message', message: { kind: 'direct', pubKeyPrefix: publicKeyHex.slice(0, 12), text: `Copy that: "${text}"`, ts: now(), hops: contact.hops, snr: 6 } }),
      );
    }
  }
  async sendChannel(idx: number, text: string) {
    const channel = this.channels.find((c) => c.idx === idx);
    const zip = text.match(/\b\d{5}\b/)?.[0];
    if (channel?.name.startsWith('#') && zip) {
      const seed = Number(zip) % CONDITIONS.length;
      const temp = 58 + (Number(zip) % 30);
      this.later(this.replyDelayMs, () =>
        this.emitChannel(idx, `WX-Bot: ${zip} ${temp}°F ${CONDITIONS[seed]}. Hi ${temp + 6} Lo ${temp - 9}. Wind SW 8mph. Humidity 54%.`),
      );
    }
  }
  async sendAdvert() {}
  async setName(name: string) {
    this.name = name;
  }
  async syncClock() {}
  async drainMessages() {}
  async close() {
    this.timers.forEach(clearTimeout);
    this.emit({ type: 'disconnected' });
  }
}
