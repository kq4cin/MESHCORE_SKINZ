import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { Mesh } from '../hooks/useMesh';
import { batteryPercent } from '../lib/format';
import { WeatherSetup } from './WeatherSetup';

interface InstallPrompt extends Event {
  prompt: () => Promise<void>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card settings-section">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return <div className="kv"><span className="muted">{label}</span><span>{value}</span></div>;
}

export function SettingsTab({ mesh }: { mesh: Mesh }) {
  const { settings, updateSettings, self, device } = mesh;
  const [name, setName] = useState(self?.name ?? '');
  const [saved, setSaved] = useState<string | null>(null);
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const online = mesh.status === 'online';

  useEffect(() => setName(self?.name ?? ''), [self?.name]);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstall(e as InstallPrompt); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const flash = (msg: string) => { setSaved(msg); setTimeout(() => setSaved(null), 2000); };

  const saveName = async (e: FormEvent) => {
    e.preventDefault();
    await mesh.rename(name);
    flash('Name updated');
  };

  return (
    <div className="page narrow">
      {saved && <p className="toast" role="status">{saved}</p>}

      <Section title="Weather">
        <WeatherSetup
          key={`${settings.zip}${settings.weatherChannel}${settings.weatherTemplate}`}
          zip={settings.zip} channel={settings.weatherChannel} template={settings.weatherTemplate} submitLabel="Save"
          onSubmit={(zip, weatherChannel, weatherTemplate) => { updateSettings({ zip, weatherChannel, weatherTemplate }); flash('Weather settings saved'); }}
        />
      </Section>

      <Section title="Profile">
        <form className="inline-form" onSubmit={saveName}>
          <label className="field grow">
            <span className="field-label">Node name</span>
            <input value={name} maxLength={31} disabled={!online} onChange={(e) => setName(e.target.value)} placeholder="Connect to edit" />
          </label>
          <button className="btn btn-primary" disabled={!online || !name.trim() || name === self?.name}>Save</button>
        </form>
        {self && <Row label="Public key" value={<code>{self.publicKey.slice(0, 16)}…</code>} />}
      </Section>

      <Section title="Device">
        {online && self ? (
          <>
            <Row label="Link" value={mesh.transport === 'ble' ? 'Bluetooth' : mesh.transport === 'serial' ? 'USB' : 'Demo'} />
            {device && <Row label="Model" value={device.model} />}
            {device && <Row label="Firmware" value={device.firmware} />}
            {mesh.batteryMv != null && <Row label="Battery" value={`${batteryPercent(mesh.batteryMv)}% · ${(mesh.batteryMv / 1000).toFixed(2)} V`} />}
            <Row label="Radio" value={`${self.radioFreq.toFixed(3)} MHz · BW ${self.radioBw} · SF${self.radioSf} · CR${self.radioCr}`} />
            <Row label="TX power" value={`${self.txPower} dBm`} />
            <button className="btn btn-danger" onClick={() => void mesh.disconnect()}>Disconnect</button>
          </>
        ) : (
          <p className="muted">Not connected.</p>
        )}
      </Section>

      <Section title="App">
        {install && <button className="btn btn-primary" onClick={() => void install.prompt().then(() => setInstall(null))}>Install app</button>}
        <button className="btn btn-ghost" onClick={() => updateSettings({ onboarded: false })}>Replay setup</button>
        <button className="btn btn-ghost" onClick={() => { if (confirm('Delete all saved messages on this device?')) mesh.clearHistory(); }}>Clear message history</button>
        <p className="small muted">MeshCore Client PWA · data stays on this device.</p>
      </Section>
    </div>
  );
}
