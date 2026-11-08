// Stand-in for src/lib/radio.ts used only by `npm run screenshots`: a fake radio with sample data.
import type { Channel, Contact, Radio, RadioEvent } from '../../src/lib/types';

const now = () => Math.floor(Date.now() / 1000);
const key = (seed: string) => seed.repeat(64).slice(0, 64);

const contacts = (): Contact[] => [
  { publicKey: key('a1'), name: 'WX-Bot', kind: 'chat', lastAdvert: now() - 60, hops: 1, lat: 33.762, lon: -84.39 },
  { publicKey: key('b2'), name: 'Eagle Ridge RPT', kind: 'repeater', lastAdvert: now() - 120, hops: 1, lat: 33.8, lon: -84.33 },
  { publicKey: key('c3'), name: 'Sam (Mobile)', kind: 'chat', lastAdvert: now() - 900, hops: 2, lat: 33.73, lon: -84.42 },
  { publicKey: key('d4'), name: 'Old Glory Room', kind: 'room', lastAdvert: now() - 7200, hops: null },
];

const channels: Channel[] = [{ idx: 0, name: 'Public' }, { idx: 1, name: '#weather' }];

export const supportsBluetooth = () => true;
export const supportsSerial = () => true;

export async function connectRadio(transport: 'ble' | 'serial'): Promise<Radio> {
  const listeners = new Set<(e: RadioEvent) => void>();
  const ok = async () => undefined;
  return {
    transport,
    on: (l) => (listeners.add(l), () => listeners.delete(l)),
    getSelfInfo: async () => ({
      name: 'Liberty Base', publicKey: key('e5'), txPower: 22, maxTxPower: 22,
      radioFreq: 910.525, radioBw: 62.5, radioSf: 7, radioCr: 5, lat: 33.749, lon: -84.388,
    }),
    getDeviceInfo: async () => ({ firmware: 'v1.9.0 (05-Sep-2026)', model: 'Heltec V3' }),
    getBatteryMv: async () => 3980,
    getContacts: async () => contacts(),
    getChannels: async () => channels,
    ensureHashtagChannel: async (name) => channels.find((c) => c.name === name) ?? channels[1],
    sendDirect: ok, sendChannel: ok, sendAdvert: ok, addContact: ok, removeContact: ok, shareContact: ok,
    exportContact: async () => '', importContact: ok, setManualAdd: ok, syncClock: ok, drainMessages: ok, close: ok,
  };
}
