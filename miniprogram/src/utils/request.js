import { API_BASE_URL } from '../config/api';

function showError(message) {
  uni.showToast({ title: message || '网络请求失败', icon: 'none' });
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
