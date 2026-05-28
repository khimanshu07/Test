export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'ANALYST' | 'CLIENT_USER';
  organization: string;
  organization_name: string;
}

export interface DataSource {
  id: string;
  name: string;
  source_type: 'SAP' | 'UTILITY' | 'TRAVEL';
  configuration: any;
  is_active: boolean;
}

export interface UploadBatch {
  id: string;
  file_name: string;
  upload_timestamp: string;
  processing_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_rows: number;
  processed_rows: number;
  failed_rows: number;
  source_name?: string;
  source_type?: string;
  uploaded_by_username?: string;
}

export interface ReviewAction {
  id: string;
  reviewer_username: string;
  action_type: 'APPROVE' | 'REJECT' | 'COMMENT' | 'CORRECT';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
}

export interface EmissionRecord {
  id: string;
  source_type: 'SAP' | 'UTILITY' | 'TRAVEL';
  scope: number;
  category: string;
  activity_type: string;
  quantity: string;
  normalized_unit: string;
  emission_factor: string;
  calculated_emissions: string;
  reporting_period: string;
  source_reference: string;
  confidence_score: string;
  validation_warnings: string[];
  review_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment: string;
  uploaded_by: string;
  created_at: string;
  raw_payload?: any;
  validation_errors?: string[];
  review_actions?: ReviewAction[];
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  performed_by_username: string;
  action: string;
  timestamp: string;
  metadata: any;
}

class ApiClient {
  private getHeaders() {
    const token = localStorage.getItem('esg_access_token');
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async get<T>(url: string): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('esg_access_token');
        window.location.href = '/login';
      }
      throw new Error(`GET request to ${url} failed with status ${res.status}`);
    }
    return res.json();
  }

  async post<T>(url: string, data: any, isMultipart = false): Promise<T> {
    const headers: any = this.getHeaders();
    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers,
      body: isMultipart ? data : JSON.stringify(data)
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('esg_access_token');
        window.location.href = '/login';
      }
      const errText = await res.text();
      throw new Error(errText || `POST request to ${url} failed with status ${res.status}`);
    }
    return res.json();
  }
}

export const api = new ApiClient();
