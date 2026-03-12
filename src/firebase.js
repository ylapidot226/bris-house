const LOCAL_STORAGE_KEY = 'bris-house-events';

function getLocalEvents() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalEvents(events) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent('bris-storage-update'));
}

export function subscribeToEvents(callback) {
  callback(getLocalEvents());
  const handler = () => callback(getLocalEvents());
  const storageHandler = (e) => { if (e.key === LOCAL_STORAGE_KEY) callback(getLocalEvents()); };
  window.addEventListener('bris-storage-update', handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener('bris-storage-update', handler);
    window.removeEventListener('storage', storageHandler);
  };
}

export function addEvent(event) {
  const events = getLocalEvents();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  events.push({ id, ...event });
  saveLocalEvents(events);
  return Promise.resolve({ key: id });
}

export function deleteEvent(id) {
  const events = getLocalEvents().filter(e => e.id !== id);
  saveLocalEvents(events);
  return Promise.resolve();
}

export function updateEvent(id, data) {
  const events = getLocalEvents().map(e => e.id === id ? { ...e, ...data } : e);
  saveLocalEvents(events);
  return Promise.resolve();
}
