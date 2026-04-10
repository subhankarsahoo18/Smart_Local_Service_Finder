import axios from 'axios';

const api = axios.create({
  baseURL: 'https://smart-local-service-finder-server.onrender.com/api', // Pointing to the Node.js backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token if it exists in local storage
api.interceptors.request.use((config) => {
  const userInfo = localStorage.getItem('userInfo');
  
  if (userInfo) {
    const parsedUserInfo = JSON.parse(userInfo);
    if (parsedUserInfo.token) {
      config.headers.Authorization = `Bearer ${parsedUserInfo.token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
