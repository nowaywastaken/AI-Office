const API_BASE_URL = 'http://localhost:8000/api';
export const API_HOST = 'http://localhost:8000';

export const api = {
  async getStatus() {
    const response = await fetch(`${API_BASE_URL}/status`);
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },

  async chat(messages, api_config = null) {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        api_config: api_config ? {
          api_key: api_config.apiKey,
          base_url: api_config.baseUrl,
          model: api_config.model
        } : null
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Chat Failed');
    }
    return response.json();
  },

  async chatStream(messages, apiConfig, onChunk) {
    const response = await fetch(`${API_HOST}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages, 
        api_config: apiConfig ? {
          api_key: apiConfig.apiKey,
          base_url: apiConfig.baseUrl,
          model: apiConfig.model
        } : null 
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Streaming failed' }));
      throw new Error(error.detail || 'Streaming failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialLine = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // Process any remaining data in partialLine
        if (partialLine) {
          const trimmedLine = partialLine.trim();
          if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            if (data) onChunk(prev => prev + data);
          }
        }
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = (partialLine + chunk).split('\n');
      partialLine = lines.pop(); // Keep the last incomplete line
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(6);
          // Only append if it's not a heartbeat or empty
          if (data) {
            // We append the raw data. The generator yields plain text.
            onChunk(prev => prev + data);
          }
        }
      }
    }

  },


  async generateDocument(type, title, content, apiConfig, rawStructure) {
    const response = await fetch(`${API_BASE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type, 
        title, 
        content,
        api_config: apiConfig ? {
          api_key: apiConfig.apiKey,
          base_url: apiConfig.baseUrl,
          model: apiConfig.model
        } : null,
        raw_structure: rawStructure || null
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Generation Failed');
    }
    return response.json();
  },

  async getPreview(filename) {
    const response = await fetch(`${API_HOST}/api/preview/${filename}`);
    if (!response.ok) {
      throw new Error('Preview failed');
    }
    return response.text();
  },

  async getFileBlob(filename) {
    const response = await fetch(`${API_HOST}/api/download/${filename}`);
    if (!response.ok) {
      throw new Error('Download failed');
    }
    return response.blob();
  },

  async generateDocumentStream(prompt, type, apiConfig, onChunk) {
    const response = await fetch(`${API_HOST}/api/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt, 
        type: type || null,
        api_config: apiConfig ? {
          api_key: apiConfig.apiKey,
          base_url: apiConfig.baseUrl,
          model: apiConfig.model
        } : null 
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Streaming failed' }));
      throw new Error(error.detail || 'Streaming failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let partialLine = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        if (partialLine && partialLine.startsWith('data: ')) {
           const data = partialLine.slice(6);
           if (data) onChunk(data);
        }
        break;
      }
      const chunk = decoder.decode(value, { stream: true });
      const lines = (partialLine + chunk).split('\n');
      partialLine = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data) onChunk(data);
        }
      }
    }
  },

  async modifyDocument(currentStructure, instruction, docType, apiConfig) {
    const response = await fetch(`${API_BASE_URL}/modify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_structure: currentStructure,
        instruction,
        doc_type: docType,
        api_config: apiConfig ? {
          api_key: apiConfig.apiKey,
          base_url: apiConfig.baseUrl,
          model: apiConfig.model
        } : null
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Modification Failed');
    }
    return response.json();
  }
};

