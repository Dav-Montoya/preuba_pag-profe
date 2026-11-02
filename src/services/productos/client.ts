import { getHeaders } from "../api";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const client = async () => {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = response.json();
    return data;
}

export default client;
