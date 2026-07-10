const ENV = 'dev';

export const API_BASES = {
  dev: 'http://127.0.0.1:8000',
  prod: 'https://api.example.com',
};

export const API_BASE_URL = API_BASES[ENV];
