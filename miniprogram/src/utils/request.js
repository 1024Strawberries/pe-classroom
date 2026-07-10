import { API_BASE_URL } from '../config/api';
import { getActiveClassId, setActiveClassId } from './state';

const CLASS_MISSING_MESSAGE = '原班级不存在，请重新选择或创建班级';
let handlingMissingClass = false;

function showError(message) {
  uni.showToast({ title: message || '网络请求失败', icon: 'none' });
}

function getClassIdFromPath(path) {
  const match = path.match(/^\/api\/classes\/(\d+)(?:\/|$)/);
  return match ? Number(match[1]) : 0;
}

function isCurrentClass404(path, statusCode) {
  if (statusCode !== 404) return false;
  const pathClassId = getClassIdFromPath(path);
  const activeClassId = getActiveClassId();
  return !!pathClassId && !!activeClassId && pathClassId === activeClassId;
}

function handleMissingCurrentClass() {
  if (handlingMissingClass) return;
  handlingMissingClass = true;
  setActiveClassId(0);
  uni.showToast({ title: CLASS_MISSING_MESSAGE, icon: 'none', duration: 2500 });
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/index/index' });
    handlingMissingClass = false;
  }, 500);
}

export function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'content-type': 'application/json',
        ...(options.header || {}),
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }
        if (isCurrentClass404(path, res.statusCode)) {
          handleMissingCurrentClass();
          reject(new Error(CLASS_MISSING_MESSAGE));
          return;
        }
        const message = res.data?.detail || `请求失败：${res.statusCode}`;
        showError(message);
        reject(new Error(message));
      },
      fail(err) {
        const message = err?.errMsg || '网络连接失败';
        showError(message);
        reject(new Error(message));
      },
    });
  });
}

export function uploadFile(path, filePath, name = 'file') {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}${path}`,
      filePath,
      name,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(res.data));
          } catch {
            resolve(res.data);
          }
          return;
        }
        if (isCurrentClass404(path, res.statusCode)) {
          handleMissingCurrentClass();
          reject(new Error(CLASS_MISSING_MESSAGE));
          return;
        }
        let message = `导入失败：${res.statusCode}`;
        try {
          message = JSON.parse(res.data)?.detail || message;
        } catch {}
        showError(message);
        reject(new Error(message));
      },
      fail(err) {
        const message = err?.errMsg || '上传失败';
        showError(message);
        reject(new Error(message));
      },
    });
  });
}

export function downloadFile(path) {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url: `${API_BASE_URL}${path}`,
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.tempFilePath);
          return;
        }
        if (isCurrentClass404(path, res.statusCode)) {
          handleMissingCurrentClass();
          reject(new Error(CLASS_MISSING_MESSAGE));
          return;
        }
        const message = `下载失败：${res.statusCode}`;
        showError(message);
        reject(new Error(message));
      },
      fail(err) {
        const message = err?.errMsg || '下载失败';
        showError(message);
        reject(new Error(message));
      },
    });
  });
}

export { API_BASE_URL };
