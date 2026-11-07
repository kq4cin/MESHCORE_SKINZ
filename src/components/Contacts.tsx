import { useEffect, useMemo, useRef, useState } from 'react';
import type { Mesh } from '../hooks/useMesh';
import { initials, timeAgo } from '../lib/format';
import { DEFAULT_VIEW, loadFavorites, saveFavorites, toggleFavorite, viewContacts, type ContactFilter, type ContactSort, type ContactView } from '../lib/contacts';
import { dmConvo } from '../lib/store';
import type { Contact, ContactKind } from '../lib/types';
import { ConnectPanel } from './Connect';
import { BroadcastIcon, RefreshIcon } from './Icons';

const KIND_LABEL: Record<ContactKind, string> = { chat: 'Companion', repeater: 'Repeater', room: 'Room', sensor: 'Sensor', unknown: 'Node' };
const LONG_PRESS_MS = 500;
const CARD_PREFIX = 'meshcore://';

const FILTERS: [ContactFilter, string][] = [['all', 'All'], ['users', 'Users'], ['repeaters', 'Repeaters'], ['rooms', 'Rooms'], ['favorites', '★']];

const hopLabel = (n: Contact) => (n.hops == null ? 'flood' : n.hops === 0 ? 'direct' : `${n.hops} hop${n.hops > 1 ? 's' : ''}`);

function Row({ node, favorite, unread, onOpen, onMenu, action }: { node: Contact; favorite?: boolean; unread?: number; onOpen?: () => void; onMenu?: () => void; action?: React.ReactNode }) {
  const timer = useRef<number | undefined>(undefined);
  const fired = useRef(false);
  const cancel = () => window.clearTimeout(timer.current);
  const content = (
    <>
      <span className={`avatar kind-${node.kind}`}>{initials(node.name)}</span>
      <span className="row-main">
        <span className="row-title">{favorite ? '★ ' : ''}{node.name}</span>
        <span className="row-sub">{KIND_LABEL[node.kind]} · {hopLabel(node)}</span>
      </span>
      {!!unread && <span className="badge" aria-label={`${unread} unread`}>{unread}</span>}
      <span className="small muted">{node.lastAdvert ? timeAgo(node.lastAdvert * 1000) : '—'}</span>
    </>
  );
  if (!onMenu) return <div className="row">{content}{action}</div>;
  return (
    <button
      className="row"
      onPointerDown={() => { fired.current = false; timer.current = window.setTimeout(() => { fired.current = true; onMenu(); }, LONG_PRESS_MS); }}
      onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
      onContextMenu={(e) => { e.preventDefault(); cancel(); fired.current = true; onMenu(); }}
      onClick={() => { if (!fired.current) onOpen?.(); fired.current = false; }}
    >
      {content}
    </button>
  );
}

export function ContactsTab({ mesh, openDm }: { mesh: Mesh; openDm: (convo: string) => void }) {
  const [note, setNote] = useState<string | null>(null);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [importText, setImportText] = useState('');
  const [view, setView] = useState<ContactView>(DEFAULT_VIEW);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  useEffect(() => saveFavorites(favorites), [favorites]);
  const lastMessageAt = useMemo(
    () => Object.fromEntries(Object.entries(mesh.messages).map(([k, v]) => [k, v[v.length - 1]?.ts ?? 0])),
    [mesh.messages],
  );
  if (mesh.status !== 'online') {
    return <div className="page narrow"><ConnectPanel mesh={mesh} /></div>;
  }
  const nodes = viewContacts(mesh.contacts, view, favorites, mesh.unread, lastMessageAt);
  const known = new Set(mesh.contacts.map((n) => n.publicKey));
  const heard = mesh.heard.filter((h) => !known.has(h.publicKey));
  const canDm = (n: Contact) => n.kind === 'chat' || n.kind === 'room';

  const run = async (task: () => Promise<unknown>, ok: string, fail: string) => {
    setNote(null);
    try {
      await task();
      setNote(ok);
    } catch {
      setNote(fail);
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);
  const copyCard = (publicKey?: string) => run(async () => copy(CARD_PREFIX + await mesh.exportContact(publicKey)), 'Contact card copied.', 'Could not copy contact card.');
  const importCard = () => run(async () => {
    const hex = importText.trim().replace(CARD_PREFIX, '');
    if (!/^([0-9a-f]{2})+$/i.test(hex)) throw new Error('bad card');
    await mesh.importContact(hex);
    setImportText('');
  }, 'Contact imported.', 'That is not a valid contact card.');

  const choose = (fn: (n: Contact) => void) => { const n = selected; setSelected(null); if (n) fn(n); };

  return (
    <div className="page narrow">
      <div className="actions-row">
        <button className="btn btn-primary" onClick={() => void run(() => mesh.sendAdvert(true), 'Advert flooded across the mesh.', 'Advert failed.')}><BroadcastIcon className="btn-icon" /> Advert</button>
        <button className="btn btn-ghost" onClick={() => void run(() => mesh.sendAdvert(false), 'Advert sent to nearby nodes.', 'Advert failed.')}>Zero-hop</button>
        <button className="icon-btn" aria-label="Refresh contacts" onClick={() => void mesh.refreshContacts()}><RefreshIcon /></button>
      </div>
      <div className="actions-row">
        <button className="btn btn-ghost" onClick={() => void copyCard()}>Share my contact</button>
      </div>
      <form className="actions-row" onSubmit={(e) => { e.preventDefault(); if (importText.trim()) void importCard(); }}>
        <input aria-label="Contact card" placeholder="Paste a contact card" value={importText} onChange={(e) => setImportText(e.target.value)} />
        <button className="btn btn-ghost" disabled={!importText.trim()}>Import</button>
      </form>
      <label className="check small">
        <input type="checkbox" checked={mesh.settings.manualAdd} onChange={(e) => void run(() => mesh.setManualAdd(e.target.checked), 'Saved.', 'Could not change setting.')} />
        {' '}Approve new contacts before adding
      </label>
      <input type="search" aria-label="Search contacts" placeholder="Search contacts" value={view.query} onChange={(e) => setView({ ...view, query: e.target.value })} />
      <div className="segmented segmented-wrap" role="tablist">
        {FILTERS.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={view.filter === id} onClick={() => setView({ ...view, filter: id })}>{label}</button>
        ))}
      </div>
      <div className="actions-row">
        <select aria-label="Sort contacts" value={view.sort} onChange={(e) => setView({ ...view, sort: e.target.value as ContactSort })}>
          <option value="lastSeen">Last seen</option>
          <option value="name">Name</option>
          <option value="recent">Recent messages</option>
        </select>
        <label className="check small">
          <input type="checkbox" checked={view.unreadOnly} onChange={(e) => setView({ ...view, unreadOnly: e.target.checked })} />
          {' '}Unread
        </label>
      </div>
      {note && <p className="small muted center" role="status">{note}</p>}

      {heard.length > 0 && (<>
        <h2 className="section-title">Heard nearby</h2>
        <ul className="list">
          {heard.map((n) => (
            <li key={n.publicKey}>
              <Row node={n} action={<button className="btn btn-primary" onClick={() => void run(() => mesh.addContact(n), `Added ${n.name}.`, 'Could not add contact.')}>Add</button>} />
            </li>
          ))}
        </ul>
      </>)}

      <h2 className="section-title">Contacts ({nodes.length}{nodes.length !== mesh.contacts.length ? ` of ${mesh.contacts.length}` : ''})</h2>
      <ul className="list">
        {nodes.map((n) => (
          <li key={n.publicKey}><Row node={n} favorite={favorites.includes(n.publicKey)} unread={mesh.unread[dmConvo(n.publicKey)]} onOpen={() => (canDm(n) ? openDm(dmConvo(n.publicKey)) : setSelected(n))} onMenu={() => setSelected(n)} /></li>
        ))}
      </ul>
      {mesh.contacts.length > 0 && nodes.length === 0 && <p className="empty muted">No contacts match.</p>}
      {mesh.contacts.length === 0 && <p className="empty muted">No contacts yet. Add heard nodes, import a card, or send an advert to announce yourself.</p>}
      {nodes.length > 0 && <p className="small muted center">Long-press a contact for options.</p>}

      {selected && (
        <div className="sheet-backdrop" onClick={() => setSelected(null)}>
          <div className="sheet" role="dialog" aria-label={selected.name} onClick={(e) => e.stopPropagation()}>
            <h2>{selected.name}</h2>
            {canDm(selected) && <button className="btn btn-primary" onClick={() => choose((n) => openDm(dmConvo(n.publicKey)))}>Send message</button>}
            <button className="btn btn-ghost" onClick={() => choose((n) => setFavorites((f) => toggleFavorite(f, n.publicKey)))}>{favorites.includes(selected.publicKey) ? 'Remove from favorites' : 'Add to favorites'}</button>
            <button className="btn btn-ghost" onClick={() => choose((n) => void run(() => mesh.shareContact(n.publicKey), 'Contact shared with nearby nodes.', 'Could not share contact.'))}>Share to mesh</button>
            <button className="btn btn-ghost" onClick={() => choose((n) => void copyCard(n.publicKey))}>Copy contact card</button>
            <button className="btn btn-ghost" onClick={() => choose((n) => void run(() => mesh.removeContact(n.publicKey), `Removed ${n.name}.`, 'Could not remove contact.'))}>Remove contact</button>
            <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
