import { api, BackendUnavailableError } from './apiClient';

export const invoiceService = {
  async list(params?: any) {
    const res = await api.get('/invoices', { params });
    return res.data;
  },

  async get(id: number) {
    const res = await api.get(`/invoices/${id}`);
    return res.data;
  },

  async create(payload: any) {
    const res = await api.post('/invoices', payload);
    return res.data;
  },

  async delete(id: number) {
    await api.delete(`/invoices/${id}`);
  },

  // Download server-side generated PDF
  async downloadPdf(id: number): Promise<Blob> {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      return res.data as Blob;
    } catch (err) {
      if (err instanceof BackendUnavailableError) throw err;
      throw err;
    }
  }
};

