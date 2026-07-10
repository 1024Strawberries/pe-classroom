const ACTIVE_CLASS_KEY = 'pe_active_class_id';

export function getActiveClassId() {
  return Number(uni.getStorageSync(ACTIVE_CLASS_KEY) || 0);
}

export function setActiveClassId(id) {
  uni.setStorageSync(ACTIVE_CLASS_KEY, String(id || ''));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
