import axios from "axios";

const client = axios.create({
  baseURL: "",
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  const method = String(config.method || "get").toLowerCase();
  const isWriteRequest = ["post", "put", "patch", "delete"].includes(method);

  if (token && isWriteRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("isAdminLoggedIn");

      if (
        window.location.pathname.startsWith("/admin") &&
        window.location.pathname !== "/admin/login"
      ) {
        window.location.replace("/admin/login");
      }
    }
    return Promise.reject(error);
  }
);

export default client;
