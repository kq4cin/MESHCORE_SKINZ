import { useState } from 'react';
import type { Mesh } from '../hooks/useMesh';
import { initials, timeAgo } from '../lib/format';
import { dmConvo } from '../lib/store';
import type { ContactKind } from '../lib/types';
import { ConnectPanel } from './Connect';
import { BroadcastIcon, RefreshIcon } from './Icons';

const KIND_LABEL: Record<ContactKind, string> = { chat: 'Companion', repeater: 'Repeater', room: 'Room', sensor: 'Sensor', unknown: 'Node' };

export function NetworkTab({ mesh, openDm }: { mesh: Mesh; openDm: (convo: string) => void }) {
  const [note, setNote] = useState<string | null>(null);
  if (mesh.status !== 'online') {
    return <div className="page narrow"><ConnectPanel mesh={mesh} /></div>;
  }
  const nodes = [...mesh.contacts].sort((a, b) => b.lastAdvert - a.lastAdvert);
  const repeaters = nodes.filter((n) => n.kind === 'repeater').length;

  const advert = async (flood: boolean) => {
    setNote(null);
    try {
      await mesh.sendAdvert(flood);
      setNote(flood ? 'Advert flooded across the mesh.' : 'Advert sent to nearby nodes.');
    } catch {
      setNote('Advert failed.');
    }
  };

  return (
    <div className="page narrow">
      <div className="stats">
        <div className="stat"><span className="stat-num">{nodes.length}</span><span className="stat-label">Nodes</span></div>
        <div className="stat"><span className="stat-num">{repeaters}</span><span className="stat-label">Repeaters</span></div>
        <div className="stat"><span className="stat-num">{mesh.channels.length}</span><span className="stat-label">Channels</span></div>
      </div>
      <div className="actions-row">
        <button className="btn btn-primary" onClick={() => void advert(true)}><BroadcastIcon className="btn-icon" /> Advert</button>
        <button className="btn btn-ghost" onClick={() => void advert(false)}>Zero-hop</button>
        <button className="icon-btn" aria-label="Refresh nodes" onClick={() => void mesh.refreshContacts()}><RefreshIcon /></button>
      </div>
      {note && <p className="small muted center" role="status">{note}</p>}
      <ul className="list">
        {nodes.map((n) => {
          const canDm = n.kind === 'chat' || n.kind === 'room';
          const content = (
            <>
              <span className={`avatar kind-${n.kind}`}>{initials(n.name)}</span>
              <span className="row-main">
                <span className="row-title">{n.name}</span>
                <span className="row-sub">{KIND_LABEL[n.kind]} · {n.hops == null ? 'flood' : n.hops === 0 ? 'direct' : `${n.hops} hop${n.hops > 1 ? 's' : ''}`}</span>
              </span>
              <span className="small muted">{n.lastAdvert ? timeAgo(n.lastAdvert * 1000) : '—'}</span>
            </>
          );
          return (
            <li key={n.publicKey}>
              {canDm ? <button className="row" onClick={() => openDm(dmConvo(n.publicKey))}>{content}</button> : <div className="row">{content}</div>}
            </li>
          );
        })}
      </ul>
      {nodes.length === 0 && <p className="empty muted">No nodes heard yet. Send an advert to announce yourself.</p>}
    </div>
  );
}
