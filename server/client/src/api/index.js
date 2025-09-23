import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api', // 你的后端 API 基础 URL
  timeout: 5000, // 请求超时时间
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么，例如显示加载状态
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 对响应数据做些什么，例如隐藏加载状态
    return response;
  },
  (error) => {
    // 对响应错误做些什么，例如统一处理错误消息
    if (error.response) {
      // 服务器返回了错误状态码
      alert(`Error: ${error.response.status} - ${error.response.data.message || 'Something went wrong'}`);
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      alert('Error: No response from server. Please check your network connection.');
    } else {
      // 在设置请求时触发了错误
      alert(`Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default apiClient;