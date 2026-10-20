export type PoolType = 'Fibra' | 'Vinil' | 'Alvenaria' | 'Azulejo' | 'Outro';

export type AppointmentStatus = 'Agendado' | 'Em andamento' | 'Concluído' | 'Cancelado';

export type PaymentMethod = 'Dinheiro' | 'Pix' | 'Débito' | 'Crédito' | 'Transferência' | 'Outro';

export type PaymentStatus = 'Pago' | 'Pendente' | 'Parcial';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  company?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export type ClientStatus = 'Ativo' | 'Inativo';

export interface Client {
  id: string;
  name: string;
  cpf_cnpj: string;
  phone: string;
  whatsapp?: string;
  due_date: string; // YYYY-MM-DD (Data de Vencimento obrigatória)
  email: string;
  zip_code: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  number: string;
  complement?: string;
  notes?: string;
  status?: ClientStatus;
  service_frequency?: string;
  preferred_day?: string;
  preferred_time?: string;
  visit_days?: string[]; // e.g. ['Segunda', 'Quarta', 'Sexta']
  monthly_visit_days?: number[]; // e.g. [5, 20]
  default_service_price?: number;
  created_at: string;
  updated_at: string;
}

export interface Pool {
  id: string;
  client_id: string;
  name: string;
  type: PoolType;
  size: string; // e.g., "8x4x1.4m"
  volume: number; // in Liters e.g. 45000
  photo_url?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  default_price: number;
  estimated_duration: string; // e.g., "1h 30min"
  active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  client_id: string;
  pool_id: string;
  service_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
}

export interface ServiceRecord {
  id: string;
  client_id: string;
  pool_id: string;
  service_id: string;
  appointment_id?: string;
  service_date: string; // YYYY-MM-DD
  service_time?: string; // HH:mm
  start_time?: string; // HH:mm
  end_time?: string; // HH:mm
  start_photo?: string; // Base64 or image URL taken at the beginning (Foto Antes)
  end_photo?: string; // Base64 or image URL taken at the completion (Foto Depois)
  geo_location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
    address?: string;
  };
  responsible: string;
  description: string;
  products_used: string;
  notes?: string;
  price: number;
  discount: number;
  final_price: number;
  amount_paid: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  notes_payment?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  service_record_id: string;
  client_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string; // YYYY-MM-DD
  date?: string;
  notes?: string;
  created_at: string;
}

export interface PaymentRecord {
  id: string;
  service_record_id?: string;
  client_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  date: string;
  notes?: string;
  created_at?: string;
}

export interface ExpenseRecord {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_method: PaymentMethod;
  created_at: string;
}

export interface CompanySettings {
  id?: string;
  name: string;
  company_name?: string;
  subtitle: string;
  trade_name?: string;
  cnpj: string;
  document?: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  pix_key: string;
  bank_name?: string;
  bank_account?: string;
  logo_url: string;
  receipt_message?: string;
}

export interface ClientFeedback {
  id: string;
  client_id: string;
  client_name?: string;
  service_record_id?: string;
  pool_id?: string;
  pool_name?: string;
  service_name?: string;
  rating: number; // 1 to 5
  nps_score?: number; // 0 to 10
  tags: string[]; // e.g., ['Água Cristalina', 'Pontualidade', 'Atendimento Excelente']
  comment: string;
  technician_reply?: string;
  date: string; // YYYY-MM-DD
  created_at: string;
  source: 'whatsapp_review' | 'app_direct' | 'in_person' | 'phone';
}

export type NotificationType = 'appointment' | 'overdue_payment' | 'system_alert' | 'feedback';
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: NotificationPriority;
  entity_type?: 'appointment' | 'payment' | 'service_record' | 'client' | 'feedback' | 'system';
  entity_id?: string;
  action_page?: string;
  client_id?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  suggestedActions?: string[];
}

export type ChatRolePreset =
  | 'general'
  | 'chemical_calculator'
  | 'water_diagnosis'
  | 'whatsapp_assistant'
  | 'equipment_troubleshooting';

