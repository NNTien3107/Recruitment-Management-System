import { apiClient } from './apiClient';

export interface CvItem {
  id: string;
  candidateId: string;
  name: string;
  fileKey: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const cvApi = {
  async getCvs(): Promise<CvItem[]> {
    const res = await apiClient.get('/cvs');
    return res.data.data;
  },

  async uploadCv(file: File, name?: string, isDefault?: boolean): Promise<CvItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (isDefault !== undefined) formData.append('isDefault', String(isDefault));

    const res = await apiClient.post('/cvs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async setDefault(id: string): Promise<CvItem> {
    const res = await apiClient.patch(`/cvs/${id}/default`);
    return res.data.data;
  },

  async deleteCv(id: string): Promise<void> {
    await apiClient.delete(`/cvs/${id}`);
  },

  getDownloadUrl(id: string): string {
    return `/api/cvs/${id}/download`;
  },
};

