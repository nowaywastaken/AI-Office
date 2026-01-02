const API_BASE_URL = 'http://localhost:8000/api';
export const API_HOST = 'http://localhost:8000';

export const api = {
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/status`);
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  async generateDocument(type, title, content) {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, title, content }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Generation Failed');
    }
    return response.json();
  }
};
