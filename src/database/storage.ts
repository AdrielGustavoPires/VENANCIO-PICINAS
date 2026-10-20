import {
  Client,
  Pool,
  ServiceItem,
  Appointment,
  ServiceRecord,
  Payment,
  PaymentRecord,
  ExpenseRecord,
  CompanySettings,
  ClientFeedback,
  AppNotification,
} from '../types';
import { getDefaultPoolImageByType } from '../utils/poolImages';

const STORAGE_KEYS = {
  CLIENTS: 'venancio_piscinas_clients_v1',
  POOLS: 'venancio_piscinas_pools_v1',
  SERVICES: 'venancio_piscinas_services_v1',
  APPOINTMENTS: 'venancio_piscinas_appointments_v1',
  SERVICE_RECORDS: 'venancio_piscinas_records_v1',
  PAYMENTS: 'venancio_piscinas_payments_v1',
  EXPENSES: 'venancio_piscinas_expenses_v1',
  SETTINGS: 'venancio_piscinas_settings_v1',
  FEEDBACK: 'venancio_piscinas_feedback_v1',
  NOTIFICATIONS: 'venancio_piscinas_notifications_v1',
  DELETED_CLIENTS: 'venancio_piscinas_deleted_clients_v1',
  DELETED_ENTITIES: 'venancio_piscinas_deleted_entities_v1',
  ACCOUNTS: 'venancio_piscinas_accounts_list_v1',
  INITIALIZED: 'venancio_piscinas_initialized_v1',
  CLEAN_PROD_V2: 'venancio_piscinas_clean_prod_v2',
  PAID_DUE_DATE_SYNC_V1: 'venancio_piscinas_paid_due_date_sync_v1',
};

// Seed Data & Demo Data
export const BLANK_SETTINGS: CompanySettings = {
  id: 'company-1',
  name: 'Minha Empresa de Piscinas',
  company_name: 'Minha Empresa de Piscinas',
  subtitle: 'Tratamento & Manutenção de Piscinas',
  trade_name: 'Minha Empresa de Piscinas',
  cnpj: '',
  document: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  pix_key: '',
  bank_name: '',
  bank_account: '',
  logo_url: '',
  receipt_message: 'Agradecemos a confiança e preferência! Conte sempre conosco para manter sua piscina limpa e tratada.',
};

export const DEMO_SETTINGS: CompanySettings = {
  id: 'company-1',
  name: 'VENÂNCIO PISCINAS',
  company_name: 'VENÂNCIO PISCINAS',
  subtitle: 'Limpeza e Manutenção',
  trade_name: 'Venâncio Piscinas & Tratamento d’Água',
  cnpj: '38.492.812/0001-94',
  document: '38.492.812/0001-94',
  phone: '(11) 4720-3344',
  whatsapp: '(11) 98452-1920',
  email: 'contato@venanciopiscinas.com.br',
  address: 'Av. das Águas Cristalinas, 1250 - Jardim Paulista, São Paulo - SP',
  pix_key: '38.492.812/0001-94',
  bank_name: 'Banco Inter (077)',
  bank_account: 'Ag: 0001 • CC: 894520-3',
  logo_url: '',
  receipt_message: 'Agradecemos a confiança! Mantenha o tratamento da sua piscina em dia para garantir água sempre pura, cristalina e protegida para sua família.',
};

// Single Sample Data for Financial Management & Reference
export const EXAMPLE_CLIENT: Client = {
  id: 'client-exemplo-1',
  name: 'Carlos Eduardo (Cliente Exemplo)',
  cpf_cnpj: '123.456.789-00',
  phone: '(11) 98765-4321',
  whatsapp: '11987654321',
  due_date: '2026-10-10',
  email: 'carlos.exemplo@email.com',
  zip_code: '01310-100',
  state: 'SP',
  city: 'São Paulo',
  neighborhood: 'Bela Vista',
  street: 'Av. Paulista',
  number: '1000',
  notes: 'Cliente modelo de exemplo para referência em gestão financeira e recibos.',
  status: 'Ativo',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const EXAMPLE_POOL: Pool = {
  id: 'pool-exemplo-1',
  client_id: 'client-exemplo-1',
  name: 'Piscina Principal (Exemplo)',
  type: 'Alvenaria',
  size: '8x4x1.4m',
  volume: 45000,
  photo_url: getDefaultPoolImageByType('Alvenaria'),
  notes: 'Piscina de exemplo com tratamento regular.',
  created_at: new Date().toISOString(),
};

export const EXAMPLE_SERVICE_RECORD: ServiceRecord = {
  id: 'rec-1001',
  client_id: 'client-exemplo-1',
  pool_id: 'pool-exemplo-1',
  service_id: 'serv-exemplo',
  service_date: new Date().toISOString().split('T')[0],
  service_time: '09:00',
  responsible: 'Técnico Especialista',
  description: 'Tratamento Químico & Limpeza Completa (Exemplo)',
  products_used: 'Cloro Granulado 65% (300g), Barrilha Leve (150g), Clarificante (100ml)',
  notes: 'Aspiração de fundo, escovação das bordas, medição e balanceamento de pH (7.4) e Cloro Livre (2.5 ppm). Água cristalina.',
  price: 220.0,
  discount: 0,
  final_price: 220.0,
  amount_paid: 220.0,
  payment_status: 'Pago',
  payment_method: 'Pix',
  notes_payment: 'Pagamento recebido e confirmado via Pix',
  created_at: new Date().toISOString(),
};

export const EXAMPLE_PAYMENT: Payment = {
  id: 'pay-exemplo-1',
  service_record_id: 'rec-1001',
  client_id: 'client-exemplo-1',
  amount: 220.0,
  payment_method: 'Pix',
  payment_date: new Date().toISOString().split('T')[0],
  notes: 'Pagamento via Pix confirmado pelo cliente',
  created_at: new Date().toISOString(),
};

export const EXAMPLE_EXPENSE: ExpenseRecord = {
  id: 'exp-exemplo-1',
  category: 'Produtos Químicos (Cloro/Barrilha/Algicida)',
  description: 'Exemplo: Compra de 1 Balde de Cloro HTH 10kg + Barrilha Leve',
  amount: 180.0,
  date: new Date().toISOString().split('T')[0],
  payment_method: 'Pix',
  created_at: new Date().toISOString(),
};

const INITIAL_SETTINGS = BLANK_SETTINGS;

const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    category: 'Produtos Químicos (Cloro/Barrilha/Algicida)',
    description: '10 Baldes de Cloro Granulado HTH 10kg + Barrilha Leve',
    amount: 820.0,
    date: '2026-08-15',
    payment_method: 'Pix',
    created_at: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'exp-2',
    category: 'Combustível & Transporte',
    description: 'Abastecimento Fiorino Manutenção (Gasolina)',
    amount: 240.0,
    date: '2026-08-18',
    payment_method: 'Débito',
    created_at: '2026-08-18T08:30:00.000Z',
  },
  {
    id: 'exp-3',
    category: 'Peças e Equipamentos de Reposição',
    description: '2 Selos mecânicos Dancor + Rolamentos blindados',
    amount: 190.0,
    date: '2026-08-22',
    payment_method: 'Pix',
    created_at: '2026-08-22T14:15:00.000Z',
  },
  {
    id: 'exp-4',
    category: 'Ferramentas & Acessórios',
    description: 'Mangueira flutuante 12m + Cabo telescópico de alumínio',
    amount: 215.0,
    date: '2026-08-23',
    payment_method: 'Crédito',
    created_at: '2026-08-23T11:00:00.000Z',
  },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'client-adriel',
    name: 'Adriel Gustavo Pires',
    cpf_cnpj: '381.920.471-88',
    phone: '(11) 99876-5432',
    whatsapp: '11998765432',
    due_date: '2026-10-10',
    email: 'adril.gustavo.pires@gmail.com',
    zip_code: '01310-100',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Bela Vista',
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Casa 01',
    notes: 'Cliente preferencial. Piscina de fibra com tratamento mensal regular.',
    status: 'Ativo',
    service_frequency: 'Mensal',
    preferred_day: 'Segunda-feira',
    preferred_time: 'Manhã (09:00)',
    default_service_price: 220.0,
    created_at: '2026-06-01T08:00:00.000Z',
    updated_at: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'client-1',
    name: 'Dr. Roberto Albuquerque',
    cpf_cnpj: '189.472.958-32',
    phone: '(11) 98123-4567',
    whatsapp: '11981234567',
    due_date: '2026-10-15',
    email: 'roberto.albuquerque@email.com',
    zip_code: '01452-001',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Jardim Europa',
    street: 'Rua das Acácias',
    number: '340',
    complement: 'Casa 02',
    notes: 'Piscina aquecida com borda infinita. Portão de serviço liberado pelo WhatsApp.',
    status: 'Ativo',
    service_frequency: 'Semanal',
    preferred_day: 'Quinta-feira',
    preferred_time: 'Manhã (09:00)',
    default_service_price: 180.0,
    created_at: '2026-06-10T10:00:00.000Z',
    updated_at: '2026-08-20T14:30:00.000Z',
  },
  {
    id: 'client-2',
    name: 'Marina Silveira Prado',
    cpf_cnpj: '298.541.879-10',
    phone: '(11) 99765-4321',
    whatsapp: '11997654321',
    due_date: '2026-10-20',
    email: 'marina.prado@arquitetura.com.br',
    zip_code: '04538-133',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Itaim Bibi',
    street: 'Rua Pedroso Alvarenga',
    number: '1150',
    complement: 'Apto 182 - Cobertura',
    notes: 'Piscina na cobertura. Acesso pelo elevador de serviço, avisar portaria.',
    status: 'Ativo',
    service_frequency: 'Semanal',
    preferred_day: 'Sexta-feira',
    preferred_time: 'Manhã (10:30)',
    default_service_price: 180.0,
    created_at: '2026-06-15T11:00:00.000Z',
    updated_at: '2026-08-22T09:15:00.000Z',
  },
  {
    id: 'client-3',
    name: 'Condomínio Residencial Vista do Lago',
    cpf_cnpj: '45.192.834/0001-20',
    phone: '(11) 4782-9900',
    whatsapp: '11973448822',
    due_date: '2026-10-05',
    email: 'administracao@vistadolago.com.br',
    zip_code: '06543-005',
    state: 'SP',
    city: 'Santana de Parnaíba',
    neighborhood: 'Alphaville',
    street: 'Alameda dos Eucaliptos',
    number: '800',
    complement: 'Área de Lazer / Clube',
    notes: 'Piscina semiolímpica e piscina infantil. Manutenção necessária 2x por semana (Terças e Sextas).',
    status: 'Ativo',
    service_frequency: '2x por semana',
    preferred_day: 'Terça e Sexta',
    preferred_time: 'Manhã (08:00)',
    default_service_price: 450.0,
    created_at: '2026-05-01T08:00:00.000Z',
    updated_at: '2026-08-25T16:00:00.000Z',
  },
  {
    id: 'client-4',
    name: 'Carlos Eduardo Fontes',
    cpf_cnpj: '312.876.459-04',
    phone: '(11) 98322-1100',
    whatsapp: '11983221100',
    due_date: '2026-10-10',
    email: 'carlos.fontes@advocacia.com.br',
    zip_code: '05650-000',
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Morumbi',
    street: 'Av. Giovanni Gronchi',
    number: '4200',
    complement: 'Condomínio Villa Bella',
    notes: 'Possui cão dócil no quintal. Preferência por atendimento no período da manhã.',
    status: 'Ativo',
    service_frequency: 'Quinzenal',
    preferred_day: 'Sábado',
    preferred_time: 'Manhã (08:30)',
    default_service_price: 190.0,
    created_at: '2026-07-02T13:30:00.000Z',
    updated_at: '2026-08-24T11:00:00.000Z',
  },
  {
    id: 'client-5',
    name: 'Juliana Mendes Castro',
    cpf_cnpj: '405.198.732-88',
    phone: '(11) 99118-7766',
    whatsapp: '11991187766',
    due_date: '2026-10-25',
    email: 'juliana.castro@mendes.com.br',
    zip_code: '06709-015',
    state: 'SP',
    city: 'Cotia',
    neighborhood: 'Granja Viana',
    street: 'Estrada da Aldeia',
    number: '620',
    complement: '',
    notes: 'Piscina de vinil com hidromassagem integrada.',
    status: 'Ativo',
    service_frequency: 'Semanal',
    preferred_day: 'Quarta-feira',
    preferred_time: 'Tarde (15:00)',
    default_service_price: 180.0,
    created_at: '2026-07-18T09:00:00.000Z',
    updated_at: '2026-08-26T08:45:00.000Z',
  },
];

const INITIAL_POOLS: Pool[] = [
  {
    id: 'pool-adriel-1',
    client_id: 'client-adriel',
    name: 'Piscina Principal',
    type: 'Fibra',
    size: '8x4x1.4m',
    volume: 35000,
    photo_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&auto=format&fit=crop&q=80',
    address: 'Quintal / Área Externa',
    notes: 'Frequência: Mensal. Dia preferencial: Segunda-feira',
    created_at: '2026-06-01T08:30:00.000Z',
  },
  {
    id: 'pool-1',
    client_id: 'client-1',
    name: 'Piscina Principal (Borda Infinita)',
    type: 'Alvenaria',
    size: '10m x 4.5m x 1.5m',
    volume: 65000,
    photo_url: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=600&auto=format&fit=crop&q=80',
    address: 'Rua das Acácias, 340 - Jardim Europa',
    notes: 'Revestimento em pedra hijau e pastilhas atlas. Tratamento com gerador de ozônio.',
    created_at: '2026-06-10T10:30:00.000Z',
  },
  {
    id: 'pool-2',
    client_id: 'client-2',
    name: 'Piscina Cobertura',
    type: 'Fibra',
    size: '6m x 3m x 1.2m',
    volume: 21000,
    photo_url: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?w=600&auto=format&fit=crop&q=80',
    address: 'Rua Pedroso Alvarenga, 1150 - Cobertura',
    notes: 'Instalada em deck de madeira cumaru com aquecedor elétrico.',
    created_at: '2026-06-15T11:20:00.000Z',
  },
  {
    id: 'pool-3',
    client_id: 'client-3',
    name: 'Piscina Semiolímpica Adulto',
    type: 'Azulejo',
    size: '25m x 10m x 1.6m',
    volume: 380000,
    photo_url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80',
    address: 'Alameda dos Eucaliptos, 800 - Clube',
    notes: 'Dois filtros DFR-30 com areia especial. Bomba de 3CV.',
    created_at: '2026-05-01T08:30:00.000Z',
  },
  {
    id: 'pool-4',
    client_id: 'client-3',
    name: 'Piscina Infantil com Cascata',
    type: 'Azulejo',
    size: '6m x 4m x 0.6m',
    volume: 14000,
    photo_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    address: 'Alameda dos Eucaliptos, 800 - Área Kids',
    notes: 'Cloração rigorosa para segurança das crianças.',
    created_at: '2026-05-01T08:40:00.000Z',
  },
  {
    id: 'pool-5',
    client_id: 'client-4',
    name: 'Piscina Retangular com Prainha',
    type: 'Alvenaria',
    size: '8m x 4m x 1.4m',
    volume: 42000,
    photo_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
    address: 'Av. Giovanni Gronchi, 4200',
    notes: 'Sistema de iluminação LED RGB e aquecimento solar.',
    created_at: '2026-07-02T14:00:00.000Z',
  },
  {
    id: 'pool-6',
    client_id: 'client-5',
    name: 'Piscina de Vinil com Spa',
    type: 'Vinil',
    size: '7m x 3.5m x 1.3m',
    volume: 30000,
    photo_url: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80',
    address: 'Estrada da Aldeia, 620',
    notes: 'Vinil estampado 0.8mm reforçado.',
    created_at: '2026-07-18T09:30:00.000Z',
  },
];

const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'serv-1',
    name: 'Limpeza Completa e Aspiração',
    description: 'Aspiração ao fundo, escovação de paredes e fundo, peneiração de folhas e limpeza pré-filtro.',
    default_price: 180.0,
    estimated_duration: '1h 30min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-2',
    name: 'Tratamento Químico e Balanço de pH',
    description: 'Análise completa de cloro livre, pH, alcalinidade total e dureza cálcica com ajuste químico.',
    default_price: 140.0,
    estimated_duration: '1h 00min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-3',
    name: 'Manutenção de Motobomba',
    description: 'Revisão do motor, lubrificação, substituição de selo mecânico e desobstrução de rotor.',
    default_price: 350.0,
    estimated_duration: '2h 30min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-4',
    name: 'Troca de Areia do Filtro',
    description: 'Remoção de carga filtrante antiga, higienização interna da carcaça e inserção de areia especial tratada.',
    default_price: 480.0,
    estimated_duration: '3h 00min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-5',
    name: 'Limpeza de Bordas e Desincrustação',
    description: 'Aplicação de limpa-bordas neutro biodegradável para eliminação de oleosidade e sujeira incrustada.',
    default_price: 120.0,
    estimated_duration: '45min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-6',
    name: 'Aplicação de Clarificante e Algicida',
    description: 'Decantação de partículas suspensas, eliminação e prevenção de algas verdes e amarelas.',
    default_price: 160.0,
    estimated_duration: '1h 15min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-7',
    name: 'Manutenção e Troca de Componentes',
    description: 'Substituição de registros, skimmer, drenos de fundo, bocais de retorno e válvulas seletoras.',
    default_price: 280.0,
    estimated_duration: '2h 00min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-8',
    name: 'Instalação de Clorador Automático / Salino',
    description: 'Instalação mecânica e elétrica de gerador de cloro por eletrólise de sal.',
    default_price: 650.0,
    estimated_duration: '3h 30min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-9',
    name: 'Limpeza Pós-Obra e Recuperação de Água Verde',
    description: 'Tratamento de choque de alta potência, floculação pesada e aspiração para dreno.',
    default_price: 450.0,
    estimated_duration: '4h 00min',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'serv-10',
    name: 'Plano Mensal de Conservação (4 visitas)',
    description: 'Plano premium de manutenção semanal completa com todos os produtos químicos inclusos.',
    default_price: 680.0,
    estimated_duration: 'Semanal',
    active: true,
    created_at: '2026-01-10T10:00:00.000Z',
  },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'app-1',
    client_id: 'client-1',
    pool_id: 'pool-1',
    service_id: 'serv-1',
    date: '2026-08-27',
    time: '09:00',
    status: 'Agendado',
    notes: 'Visita semanal padrão. Verificar pressão do manômetro do filtro.',
    created_at: '2026-08-24T08:00:00.000Z',
  },
  {
    id: 'app-2',
    client_id: 'client-3',
    pool_id: 'pool-3',
    service_id: 'serv-2',
    date: '2026-08-27',
    time: '14:00',
    status: 'Agendado',
    notes: 'Medição de pH e dosagem preventiva de cloro para o fim de semana.',
    created_at: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'app-3',
    client_id: 'client-2',
    pool_id: 'pool-2',
    service_id: 'serv-1',
    date: '2026-08-28',
    time: '10:30',
    status: 'Agendado',
    notes: 'Limpeza de bordas e aspiração na cobertura.',
    created_at: '2026-08-25T11:00:00.000Z',
  },
  {
    id: 'app-4',
    client_id: 'client-4',
    pool_id: 'pool-5',
    service_id: 'serv-4',
    date: '2026-08-29',
    time: '08:30',
    status: 'Agendado',
    notes: 'Troca de areia do filtro Jacuzzi com 4 sacos de 25kg.',
    created_at: '2026-08-26T09:00:00.000Z',
  },
  {
    id: 'app-5',
    client_id: 'client-5',
    pool_id: 'pool-6',
    service_id: 'serv-6',
    date: '2026-08-26',
    time: '15:00',
    status: 'Em andamento',
    notes: 'Aplicação de clarificante e escovação da hidro.',
    created_at: '2026-08-26T07:30:00.000Z',
  },
];

const INITIAL_RECORDS: ServiceRecord[] = [
  // Agosto 2026
  {
    id: 'rec-1001',
    client_id: 'client-1',
    pool_id: 'pool-1',
    service_id: 'serv-10',
    service_date: '2026-08-20',
    service_time: '09:00',
    responsible: 'Venâncio Alves',
    description: 'Manutenção mensal - Visita 3. Aspiração de fundo, escovação e ajuste de alcalinidade.',
    products_used: 'Cloro granulado 65% (400g), Barrilha Leve (300g), Limpa Bordas (100ml)',
    notes: 'Água cristalina, parâmetros de pH em 7.4 e cloro livre em 2.5ppm.',
    price: 680.0,
    discount: 30.0,
    final_price: 650.0,
    amount_paid: 650.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-08-20T11:00:00.000Z',
  },
  {
    id: 'rec-1002',
    client_id: 'client-3',
    pool_id: 'pool-3',
    service_id: 'serv-9',
    service_date: '2026-08-22',
    service_time: '08:00',
    responsible: 'Venâncio Alves',
    description: 'Tratamento de choque na piscina semiolímpica após temporal. Floculação pesada e aspiração para dreno.',
    products_used: 'Sulfato de Alumínio (5kg), Barrilha Leve (3kg), Cloro Choque HTH (4kg)',
    notes: 'Água completamente recuperada para uso dos condôminos.',
    price: 950.0,
    discount: 50.0,
    final_price: 900.0,
    amount_paid: 900.0,
    payment_method: 'Transferência',
    payment_status: 'Pago',
    created_at: '2026-08-22T13:30:00.000Z',
  },
  {
    id: 'rec-1003',
    client_id: 'client-2',
    pool_id: 'pool-2',
    service_id: 'serv-1',
    service_date: '2026-08-24',
    service_time: '11:00',
    responsible: 'Carlos Souza',
    description: 'Limpeza completa, aspiração cuidadosa e lavagem das pedras de borda.',
    products_used: 'Cloro orgânico estabilizado (200g), Clarificante Max (150ml)',
    notes: 'Cliente solicitou agendamento para a próxima semana.',
    price: 180.0,
    discount: 0.0,
    final_price: 180.0,
    amount_paid: 180.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-08-24T12:30:00.000Z',
  },
  {
    id: 'rec-1004',
    client_id: 'client-4',
    pool_id: 'pool-5',
    service_id: 'serv-3',
    service_date: '2026-08-25',
    service_time: '14:00',
    responsible: 'Venâncio Alves',
    description: 'Troca do selo mecânico da motobomba Dancor e desobstrução do rotor. Teste de vazão com sucesso.',
    products_used: 'Selo mecânico 3/4", Rolamento 6202 DDU, Veda junta',
    notes: 'Bomba funcionando silenciosamente e com pressão perfeita.',
    price: 380.0,
    discount: 0.0,
    final_price: 380.0,
    amount_paid: 200.0,
    payment_method: 'Crédito',
    payment_status: 'Parcial',
    notes_payment: 'Entrada de R$ 200,00 paga. Restante acordado para 30/08.',
    created_at: '2026-08-25T16:45:00.000Z',
  } as any,
  {
    id: 'rec-1005',
    client_id: 'client-5',
    pool_id: 'pool-6',
    service_id: 'serv-1',
    service_date: '2026-08-25',
    service_time: '16:30',
    responsible: 'Carlos Souza',
    description: 'Aspiração da piscina e do spa, higienização dos filtros de cartucho.',
    products_used: 'Algicida Manutenção (150ml), Cloro pastilha Tricloro 200g',
    notes: 'Aguardando confirmação de pagamento via PIX.',
    price: 200.0,
    discount: 20.0,
    final_price: 180.0,
    amount_paid: 0.0,
    payment_method: 'Pix',
    payment_status: 'Pendente',
    created_at: '2026-08-25T18:00:00.000Z',
  },
  {
    id: 'rec-1006',
    client_id: 'client-1',
    pool_id: 'pool-1',
    service_id: 'serv-2',
    service_date: '2026-08-12',
    service_time: '09:30',
    responsible: 'Venâncio Alves',
    description: 'Balanço químico e dosagem semanal de cloro e algicida.',
    products_used: 'Cloro 65% (350g), Algicida choque (100ml)',
    notes: 'Parâmetros verificados e balanceados.',
    price: 180.0,
    discount: 0.0,
    final_price: 180.0,
    amount_paid: 180.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-08-12T11:00:00.000Z',
  },
  // Julho 2026
  {
    id: 'rec-2001',
    client_id: 'client-3',
    pool_id: 'pool-3',
    service_id: 'serv-4',
    service_date: '2026-07-28',
    service_time: '08:30',
    responsible: 'Venâncio Alves',
    description: 'Troca de Areia do Filtro Jacuzzi com 4 sacos de areia especial 25kg.',
    products_used: 'Areia filtrante especial (100kg), Higienizante de carcaça',
    notes: 'Filtro operando com pressão nominal perfeita.',
    price: 480.0,
    discount: 0.0,
    final_price: 480.0,
    amount_paid: 480.0,
    payment_method: 'Transferência',
    payment_status: 'Pago',
    created_at: '2026-07-28T12:00:00.000Z',
  },
  {
    id: 'rec-2002',
    client_id: 'client-1',
    pool_id: 'pool-1',
    service_id: 'serv-1',
    service_date: '2026-07-22',
    service_time: '10:00',
    responsible: 'Carlos Souza',
    description: 'Limpeza completa, escovação de pastilhas atlas e aspiração.',
    products_used: 'Cloro estabilizado (300g), Limpa bordas (80ml)',
    notes: 'Água límpida.',
    price: 180.0,
    discount: 0.0,
    final_price: 180.0,
    amount_paid: 180.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-07-22T11:30:00.000Z',
  },
  {
    id: 'rec-2003',
    client_id: 'client-2',
    pool_id: 'pool-2',
    service_id: 'serv-2',
    service_date: '2026-07-15',
    service_time: '14:00',
    responsible: 'Carlos Souza',
    description: 'Ajuste de pH e alcalinidade total com barrilha leve e cloro orgânico.',
    products_used: 'Barrilha leve (250g), Cloro pastilha (200g)',
    notes: 'Aprovado pelo cliente.',
    price: 150.0,
    discount: 0.0,
    final_price: 150.0,
    amount_paid: 150.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-07-15T15:30:00.000Z',
  },
  {
    id: 'rec-2004',
    client_id: 'client-4',
    pool_id: 'pool-5',
    service_id: 'serv-1',
    service_date: '2026-07-10',
    service_time: '09:00',
    responsible: 'Venâncio Alves',
    description: 'Limpeza geral pós-inverno, aspiração ao dreno e escovação profunda.',
    products_used: 'Clarificante (200ml), Cloro choque (500g)',
    notes: 'Piscina renovada.',
    price: 220.0,
    discount: 0.0,
    final_price: 220.0,
    amount_paid: 220.0,
    payment_method: 'Crédito',
    payment_status: 'Pago',
    created_at: '2026-07-10T11:00:00.000Z',
  },
  {
    id: 'rec-2005',
    client_id: 'client-5',
    pool_id: 'pool-6',
    service_id: 'serv-6',
    service_date: '2026-07-05',
    service_time: '16:00',
    responsible: 'Carlos Souza',
    description: 'Aplicação de clarificante e decantação com eliminação de oleosidade.',
    products_used: 'Clarificante Max (200ml), Limpa bordas (100ml)',
    notes: 'Água cristalina.',
    price: 160.0,
    discount: 0.0,
    final_price: 160.0,
    amount_paid: 160.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-07-05T17:30:00.000Z',
  },
  // Junho 2026
  {
    id: 'rec-3001',
    client_id: 'client-3',
    pool_id: 'pool-3',
    service_id: 'serv-1',
    service_date: '2026-06-25',
    service_time: '08:00',
    responsible: 'Venâncio Alves',
    description: 'Manutenção da piscina olímpica do condomínio e conferência de registros.',
    products_used: 'Cloro granulado (3kg), Barrilha (2kg)',
    notes: 'Parâmetros rigorosamente dentro da norma.',
    price: 450.0,
    discount: 0.0,
    final_price: 450.0,
    amount_paid: 450.0,
    payment_method: 'Transferência',
    payment_status: 'Pago',
    created_at: '2026-06-25T11:00:00.000Z',
  },
  {
    id: 'rec-3002',
    client_id: 'client-1',
    pool_id: 'pool-1',
    service_id: 'serv-1',
    service_date: '2026-06-18',
    service_time: '09:00',
    responsible: 'Carlos Souza',
    description: 'Limpeza quinzenal e peneiração de folhas.',
    products_used: 'Cloro 65% (300g)',
    notes: 'Tudo em ordem.',
    price: 180.0,
    discount: 0.0,
    final_price: 180.0,
    amount_paid: 180.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-06-18T10:30:00.000Z',
  },
  {
    id: 'rec-3003',
    client_id: 'client-2',
    pool_id: 'pool-2',
    service_id: 'serv-3',
    service_date: '2026-06-10',
    service_time: '13:30',
    responsible: 'Venâncio Alves',
    description: 'Revisão geral da motobomba e lubrificação do pré-filtro.',
    products_used: 'Graxa de silicone atóxica, Anel oring',
    notes: 'Equipamento revisado.',
    price: 250.0,
    discount: 0.0,
    final_price: 250.0,
    amount_paid: 250.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-06-10T15:00:00.000Z',
  },
  {
    id: 'rec-3004',
    client_id: 'client-4',
    pool_id: 'pool-5',
    service_id: 'serv-2',
    service_date: '2026-06-03',
    service_time: '10:00',
    responsible: 'Carlos Souza',
    description: 'Balanço químico de pH e alcalinidade.',
    products_used: 'Elevador de alcalinidade (500g)',
    notes: 'Equilibrado.',
    price: 140.0,
    discount: 0.0,
    final_price: 140.0,
    amount_paid: 140.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-06-03T11:00:00.000Z',
  },
  // Maio 2026
  {
    id: 'rec-4001',
    client_id: 'client-3',
    pool_id: 'pool-3',
    service_id: 'serv-9',
    service_date: '2026-05-28',
    service_time: '08:00',
    responsible: 'Venâncio Alves',
    description: 'Tratamento preventivo de outono e cloração de choque.',
    products_used: 'Cloro choque HTH (3kg), Clarificante (500ml)',
    notes: 'Piscina em condições impecáveis.',
    price: 500.0,
    discount: 0.0,
    final_price: 500.0,
    amount_paid: 500.0,
    payment_method: 'Transferência',
    payment_status: 'Pago',
    created_at: '2026-05-28T11:30:00.000Z',
  },
  {
    id: 'rec-4002',
    client_id: 'client-1',
    pool_id: 'pool-1',
    service_id: 'serv-1',
    service_date: '2026-05-15',
    service_time: '09:00',
    responsible: 'Carlos Souza',
    description: 'Aspiração e escovação completa de bordas.',
    products_used: 'Cloro estabilizado (350g)',
    notes: 'Serviço concluído.',
    price: 180.0,
    discount: 0.0,
    final_price: 180.0,
    amount_paid: 180.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-05-15T10:30:00.000Z',
  },
  {
    id: 'rec-4003',
    client_id: 'client-2',
    pool_id: 'pool-2',
    service_id: 'serv-1',
    service_date: '2026-05-08',
    service_time: '14:00',
    responsible: 'Carlos Souza',
    description: 'Limpeza de rotina da cobertura e ajuste de dosador.',
    products_used: 'Cloro tablete (200g)',
    notes: 'Ok.',
    price: 180.0,
    discount: 0.0,
    final_price: 180.0,
    amount_paid: 180.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-05-08T15:30:00.000Z',
  },
  // Abril 2026
  {
    id: 'rec-5001',
    client_id: 'client-3',
    pool_id: 'pool-3',
    service_id: 'serv-1',
    service_date: '2026-04-20',
    service_time: '08:30',
    responsible: 'Venâncio Alves',
    description: 'Limpeza periódica do clube e aspiração drenando.',
    products_used: 'Cloro granulado (2kg), Algicida manutenção (300ml)',
    notes: 'Tudo 100%.',
    price: 450.0,
    discount: 0.0,
    final_price: 450.0,
    amount_paid: 450.0,
    payment_method: 'Transferência',
    payment_status: 'Pago',
    created_at: '2026-04-20T11:00:00.000Z',
  },
  {
    id: 'rec-5002',
    client_id: 'client-1',
    pool_id: 'pool-1',
    service_id: 'serv-2',
    service_date: '2026-04-10',
    service_time: '10:00',
    responsible: 'Carlos Souza',
    description: 'Tratamento químico e balanceamento de alcalinidade total.',
    products_used: 'Barrilha leve (300g), Cloro 65% (300g)',
    notes: 'Parâmetros ideais.',
    price: 160.0,
    discount: 0.0,
    final_price: 160.0,
    amount_paid: 160.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-04-10T11:30:00.000Z',
  },
  // Março 2026
  {
    id: 'rec-6001',
    client_id: 'client-3',
    pool_id: 'pool-3',
    service_id: 'serv-1',
    service_date: '2026-03-25',
    service_time: '09:00',
    responsible: 'Venâncio Alves',
    description: 'Manutenção de fim de verão e limpeza completa.',
    products_used: 'Cloro granulado (2.5kg)',
    notes: 'Condomínio atendido.',
    price: 450.0,
    discount: 0.0,
    final_price: 450.0,
    amount_paid: 450.0,
    payment_method: 'Transferência',
    payment_status: 'Pago',
    created_at: '2026-03-25T11:30:00.000Z',
  },
  {
    id: 'rec-6002',
    client_id: 'client-1',
    pool_id: 'pool-1',
    service_id: 'serv-1',
    service_date: '2026-03-12',
    service_time: '14:00',
    responsible: 'Carlos Souza',
    description: 'Limpeza de rotina e escovação das bordas.',
    products_used: 'Cloro pastilha (200g)',
    notes: 'Cliente satisfeito.',
    price: 180.0,
    discount: 0.0,
    final_price: 180.0,
    amount_paid: 180.0,
    payment_method: 'Pix',
    payment_status: 'Pago',
    created_at: '2026-03-12T15:30:00.000Z',
  },
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-1',
    service_record_id: 'rec-1001',
    amount: 650.0,
    payment_method: 'Pix',
    payment_date: '2026-08-20',
    notes: 'Pagamento integral via Chave Pix CNPJ',
    created_at: '2026-08-20T11:05:00.000Z',
  },
  {
    id: 'pay-2',
    service_record_id: 'rec-1002',
    amount: 900.0,
    payment_method: 'Transferência',
    payment_date: '2026-08-22',
    notes: 'TED bancária aprovada',
    created_at: '2026-08-22T14:00:00.000Z',
  },
  {
    id: 'pay-3',
    service_record_id: 'rec-1003',
    amount: 180.0,
    payment_method: 'Pix',
    payment_date: '2026-08-24',
    notes: 'Pix recebido no ato',
    created_at: '2026-08-24T12:35:00.000Z',
  },
  {
    id: 'pay-4',
    service_record_id: 'rec-1004',
    amount: 200.0,
    payment_method: 'Crédito',
    payment_date: '2026-08-25',
    notes: 'Sinal de entrada no cartão',
    created_at: '2026-08-25T16:50:00.000Z',
  },
];

const INITIAL_FEEDBACK: ClientFeedback[] = [
  {
    id: 'fb-1',
    client_id: 'client-1',
    client_name: 'Dr. Roberto Albuquerque',
    service_record_id: 'rec-1001',
    pool_id: 'pool-1',
    pool_name: 'Piscina Principal - Borda Infinita',
    service_name: 'Manutenção Mensal de Piscina',
    rating: 5,
    nps_score: 10,
    tags: ['Água Cristalina', 'Pontualidade Britânica', 'Excelente Atendimento', 'Parâmetros Perfeitos'],
    comment: 'Trabalho impecável do Venâncio e equipe! A piscina do Jardim Europa ficou com a água 100% cristalina, parâmetros de pH e cloro perfeitos e sem nenhum cheiro forte. Muito atencioso e pontual.',
    technician_reply: 'Muito obrigado pela confiança de sempre, Dr. Roberto! É um prazer cuidar da sua piscina.',
    date: '2026-08-21',
    created_at: '2026-08-21T14:30:00.000Z',
    source: 'whatsapp_review',
  },
  {
    id: 'fb-2',
    client_id: 'client-2',
    client_name: 'Marina Silveira Prado',
    service_record_id: 'rec-1003',
    pool_id: 'pool-2',
    pool_name: 'Piscina Cobertura Duplex',
    service_name: 'Limpeza Completa & Aspiração',
    rating: 5,
    nps_score: 10,
    tags: ['Água Cristalina', 'Cuidado com a Cobertura', 'Técnico Educado', 'Equipe Confiável'],
    comment: 'Excelente manutenção na piscina da cobertura. Equipe super pontual, extremamente cuidadosa no transporte dos produtos pelo elevador de serviço e muito educada. Nota 10!',
    date: '2026-08-24',
    created_at: '2026-08-24T15:10:00.000Z',
    source: 'app_direct',
  },
  {
    id: 'fb-3',
    client_id: 'client-3',
    client_name: 'Condomínio Residencial Alphaville',
    service_record_id: 'rec-1002',
    pool_id: 'pool-3',
    pool_name: 'Piscina Semiolímpica Adulto',
    service_name: 'Tratamento Químico de Choque',
    rating: 5,
    nps_score: 10,
    tags: ['Solução Rápida', 'Água Cristalina', 'Preço Justo', 'Equipamento Revisado'],
    comment: 'A piscina semiolímpica estava verde após a forte tempestade do final de semana. O tratamento de choque do Venâncio recuperou a água em menos de 24 horas! Os condôminos elogiaram muito.',
    technician_reply: 'Agradecemos a parceria com a administração do condomínio! Sempre prontos para emergências.',
    date: '2026-08-23',
    created_at: '2026-08-23T16:00:00.000Z',
    source: 'whatsapp_review',
  },
  {
    id: 'fb-4',
    client_id: 'client-4',
    client_name: 'Renato & Juliana Vianna',
    service_record_id: 'rec-1004',
    pool_id: 'pool-5',
    pool_name: 'Piscina Alvenaria Aquecida',
    service_name: 'Conserto de Motobomba & Troca de Selo',
    rating: 4,
    nps_score: 9,
    tags: ['Bomba Silenciosa', 'Técnico Qualificado', 'Comprovante Rápido'],
    comment: 'Resolveram o barulho ensurdecedor da motobomba trocando o selo mecânico e rolamentos. O serviço foi muito rápido e a pressão da hidro voltou com força.',
    date: '2026-08-25',
    created_at: '2026-08-25T17:30:00.000Z',
    source: 'in_person',
  },
  {
    id: 'fb-5',
    client_id: 'client-5',
    client_name: 'Espaço Villa Imperial Eventos',
    service_record_id: 'rec-1005',
    pool_id: 'pool-6',
    pool_name: 'Piscina Decorativa com Cascata',
    service_name: 'Limpeza Completa & Aspiração',
    rating: 5,
    nps_score: 10,
    tags: ['Água Cristalina', 'Pronto para Evento', 'Pontualidade'],
    comment: 'Piscina e spa ficaram um espelho de tão limpos para o casamento do fim de semana. Trabalho impecável!',
    date: '2026-08-25',
    created_at: '2026-08-25T19:00:00.000Z',
    source: 'app_direct',
  },
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'appointment',
    title: 'Agendamento Confirmado',
    message: 'Dr. Roberto Albuquerque - Manutenção Mensal agendada para hoje às 14:00 (Jardim Europa).',
    timestamp: '2026-08-26T08:30:00.000Z',
    read: false,
    priority: 'high',
    entity_type: 'appointment',
    entity_id: 'app-1',
    action_page: 'agenda',
    client_id: 'client-1',
  },
  {
    id: 'notif-2',
    type: 'overdue_payment',
    title: 'Cobrança Pendente',
    message: 'Espaço Villa Imperial Eventos possui serviço de R$ 180,00 com pagamento pendente.',
    timestamp: '2026-08-26T09:15:00.000Z',
    read: false,
    priority: 'high',
    entity_type: 'payment',
    entity_id: 'rec-1005',
    action_page: 'financeiro',
    client_id: 'client-5',
  },
  {
    id: 'notif-3',
    type: 'feedback',
    title: 'Nova Avaliação 5 Estrelas ⭐',
    message: 'Marina Silveira Prado avaliou o serviço: "Excelente manutenção na piscina da cobertura. Nota 10!"',
    timestamp: '2026-08-26T10:00:00.000Z',
    read: false,
    priority: 'medium',
    entity_type: 'feedback',
    entity_id: 'fb-2',
    action_page: 'relatorios',
    client_id: 'client-2',
  },
  {
    id: 'notif-4',
    type: 'system_alert',
    title: 'Alerta Operacional: Estoque de Cloro',
    message: 'O estoque de Cloro HTH Granulado atingiu o nível de reposição recomendado (apenas 2 baldes restantes).',
    timestamp: '2026-08-26T07:45:00.000Z',
    read: false,
    priority: 'medium',
    entity_type: 'system',
    action_page: 'financeiro',
  },
  {
    id: 'notif-5',
    type: 'system_alert',
    title: 'Dica Técnica: Previsão de Chuvas',
    message: 'Semana com previsão de chuvas intensas. Recomenda-se reforçar a dosagem de alcalinizante e cloro nas piscinas abertas.',
    timestamp: '2026-08-25T17:00:00.000Z',
    read: true,
    priority: 'low',
    entity_type: 'system',
    action_page: 'agenda',
  },
];

// Event listener mechanism for reactive updates
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export function subscribeToDatabase(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDatabaseChanged() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error notifying database listener', e);
    }
  });
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch {
    return fallback;
  }
}

// Inter-tab sync channel
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('venancio_piscinas_cross_tab_sync')
  : null;

if (syncChannel) {
  syncChannel.onmessage = (event) => {
    if (event.data === 'db_updated') {
      notifyDatabaseChanged();
    }
  };
}

let syncTimeout: any = null;
let isMutating = false;
let lastMutationTime = 0;

function getDeletedClientIds(): string[] {
  return safeGet<string[]>(STORAGE_KEYS.DELETED_CLIENTS, []);
}

function addDeletedClientId(id: string): void {
  const current = new Set(getDeletedClientIds());
  current.add(id);
  localStorage.setItem(STORAGE_KEYS.DELETED_CLIENTS, JSON.stringify(Array.from(current)));
}

function getDeletedEntityIds(): string[] {
  return safeGet<string[]>(STORAGE_KEYS.DELETED_ENTITIES, []);
}

function addDeletedEntityId(id: string): void {
  const current = new Set(getDeletedEntityIds());
  current.add(id);
  localStorage.setItem(STORAGE_KEYS.DELETED_ENTITIES, JSON.stringify(Array.from(current)));
}

function mergeClientAndServerArrays<T extends { id?: string; client_id?: string; updated_at?: string; created_at?: string }>(
  localList: T[],
  serverList: T[],
  deletedClientSet: Set<string>,
  deletedEntitySet: Set<string>
): { merged: T[]; localHasUnsynced: boolean } {
  const map = new Map<string, T>();
  const serverIds = new Set<string>();

  const addItem = (item: T, isLocal: boolean) => {
    if (!item || !item.id) return;
    if (deletedClientSet.has(item.id) || deletedEntitySet.has(item.id)) return;
    if (item.client_id && deletedClientSet.has(item.client_id)) return;

    if (!isLocal) {
      serverIds.add(item.id);
    }

    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      return;
    }

    const existingTime = existing.updated_at || existing.created_at || '';
    const incomingTime = item.updated_at || item.created_at || '';
    if (!existingTime || !incomingTime || incomingTime >= existingTime) {
      map.set(item.id, { ...existing, ...item });
    }
  };

  if (Array.isArray(serverList)) {
    serverList.forEach(item => addItem(item, false));
  }
  if (Array.isArray(localList)) {
    localList.forEach(item => addItem(item, true));
  }

  let localHasUnsynced = false;
  if (Array.isArray(localList)) {
    for (const item of localList) {
      if (item && item.id && !deletedClientSet.has(item.id) && !deletedEntitySet.has(item.id)) {
        if (!serverIds.has(item.id)) {
          localHasUnsynced = true;
          break;
        }
      }
    }
  }

  return { merged: Array.from(map.values()), localHasUnsynced };
}

// Sincroniza os dados locais com o backend em nuvem sem perder cadastros locais recentes
export async function syncWithServer(): Promise<void> {
  // Evita sobrescrever alterações/exclusões locais recentes enquanto uma mutação está em andamento
  if (isMutating || Date.now() - lastMutationTime < 2500) {
    return;
  }

  try {
    const response = await fetch('/api/db');
    if (!response.ok) return;
    const result = await response.json();

    // Verifica novamente após o await se houve mutação local durante a requisição
    if (isMutating || Date.now() - lastMutationTime < 2500) {
      return;
    }

    if (result.success && result.data) {
      const serverData = result.data;
      let hasUpdates = false;
      let needsPushToServer = false;

      // Merge deletedClientIds from server and local
      const serverDeletedClients: string[] = Array.isArray(serverData.deletedClientIds)
        ? serverData.deletedClientIds
        : [];
      const localDeletedClients = getDeletedClientIds();
      const deletedClientSet = new Set<string>([...localDeletedClients, ...serverDeletedClients]);
      if (deletedClientSet.size !== localDeletedClients.length) {
        localStorage.setItem(STORAGE_KEYS.DELETED_CLIENTS, JSON.stringify(Array.from(deletedClientSet)));
      }

      // Merge deletedEntityIds from server and local
      const serverDeletedEntities: string[] = Array.isArray(serverData.deletedEntityIds)
        ? serverData.deletedEntityIds
        : [];
      const localDeletedEntities = getDeletedEntityIds();
      const deletedEntitySet = new Set<string>([...localDeletedEntities, ...serverDeletedEntities]);
      if (deletedEntitySet.size !== localDeletedEntities.length) {
        localStorage.setItem(STORAGE_KEYS.DELETED_ENTITIES, JSON.stringify(Array.from(deletedEntitySet)));
      }

      const syncCollection = (storageKey: string, serverItems: any[]) => {
        if (!Array.isArray(serverItems)) return;
        const localItems = safeGet<any[]>(storageKey, []);
        const { merged, localHasUnsynced } = mergeClientAndServerArrays(
          localItems,
          serverItems,
          deletedClientSet,
          deletedEntitySet
        );
        if (localHasUnsynced) {
          needsPushToServer = true;
        }
        const localStr = localStorage.getItem(storageKey);
        const mergedStr = JSON.stringify(merged);
        if (localStr !== mergedStr) {
          localStorage.setItem(storageKey, mergedStr);
          hasUpdates = true;
        }
      };

      syncCollection(STORAGE_KEYS.CLIENTS, serverData.clients);
      syncCollection(STORAGE_KEYS.POOLS, serverData.pools);
      syncCollection(STORAGE_KEYS.SERVICES, serverData.services);
      syncCollection(STORAGE_KEYS.APPOINTMENTS, serverData.appointments);
      syncCollection(STORAGE_KEYS.SERVICE_RECORDS, serverData.records);
      syncCollection(STORAGE_KEYS.PAYMENTS, serverData.payments);
      syncCollection(STORAGE_KEYS.EXPENSES, serverData.expenses);
      syncCollection(STORAGE_KEYS.FEEDBACK, serverData.feedback);
      syncCollection(STORAGE_KEYS.NOTIFICATIONS, serverData.notifications);

      if (serverData.settings && serverData.settings.name) {
        const localSettings = safeGet<CompanySettings>(STORAGE_KEYS.SETTINGS, BLANK_SETTINGS);
        if (
          localSettings.name === BLANK_SETTINGS.name &&
          serverData.settings.name !== BLANK_SETTINGS.name
        ) {
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(serverData.settings));
          hasUpdates = true;
        }
      }

      // Sync registered accounts
      if (Array.isArray(serverData.accounts)) {
        const localAccounts = safeGet<any[]>(STORAGE_KEYS.ACCOUNTS, []);
        const accMap = new Map<string, any>();
        const addAcc = (acc: any) => {
          if (!acc || !acc.email) return;
          if (acc.id === 'user-venancio' && acc.password === 'admin123') return;
          const key = String(acc.email).trim().toLowerCase();
          accMap.set(key, { ...(accMap.get(key) || {}), ...acc });
        };
        serverData.accounts.forEach(addAcc);
        localAccounts.forEach(addAcc);
        const mergedAccounts = Array.from(accMap.values());
        if (JSON.stringify(localAccounts) !== JSON.stringify(mergedAccounts)) {
          localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(mergedAccounts));
        }
      }

      if (hasUpdates) {
        notifyDatabaseChanged();
      }
      if (needsPushToServer) {
        triggerServerSync();
      }
    }
  } catch (err) {
    // Silently continue with local storage when offline
  }
}

// Envia dados locais atualizados para o servidor
export function triggerServerSync(): void {
  lastMutationTime = Date.now();
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    isMutating = true;
    try {
      const payload = {
        clients: safeGet(STORAGE_KEYS.CLIENTS, []),
        pools: safeGet(STORAGE_KEYS.POOLS, []),
        services: safeGet(STORAGE_KEYS.SERVICES, []),
        appointments: safeGet(STORAGE_KEYS.APPOINTMENTS, []),
        records: safeGet(STORAGE_KEYS.SERVICE_RECORDS, []),
        payments: safeGet(STORAGE_KEYS.PAYMENTS, []),
        expenses: safeGet(STORAGE_KEYS.EXPENSES, []),
        settings: safeGet(STORAGE_KEYS.SETTINGS, BLANK_SETTINGS),
        feedback: safeGet(STORAGE_KEYS.FEEDBACK, []),
        notifications: safeGet(STORAGE_KEYS.NOTIFICATIONS, []),
        accounts: safeGet(STORAGE_KEYS.ACCOUNTS, []),
        deletedClientIds: getDeletedClientIds(),
        deletedEntityIds: getDeletedEntityIds(),
      };

      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        if (result?.success && result?.data?.clients) {
          const localStr = localStorage.getItem(STORAGE_KEYS.CLIENTS);
          const serverStr = JSON.stringify(result.data.clients);
          if (localStr !== serverStr) {
            localStorage.setItem(STORAGE_KEYS.CLIENTS, serverStr);
            notifyDatabaseChanged();
          }
        }
      }

      if (syncChannel) {
        syncChannel.postMessage('db_updated');
      }
    } catch {
      // Offline fallback
    } finally {
      isMutating = false;
      lastMutationTime = Date.now();
    }
  }, 80);
}

function safeSet<T>(key: string, value: T): void {
  try {
    lastMutationTime = Date.now();
    localStorage.setItem(key, JSON.stringify(value));
    notifyDatabaseChanged();
    triggerServerSync();
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

// Auto-sync listeners for cross-device synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => syncWithServer());
  window.addEventListener('online', () => syncWithServer());
  // Polling sync every 6 seconds to capture updates from other computers/phones
  setInterval(() => syncWithServer(), 6000);
}

// Database Initialization (Starts clean / zeroed for production delivery)
export function initDatabase(): void {
  const isCleanProdV2 = localStorage.getItem(STORAGE_KEYS.CLEAN_PROD_V2);

  // If not yet migrated to clean production v2, wipe all legacy demo/test records
  if (!isCleanProdV2) {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.POOLS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SERVICE_RECORDS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(BLANK_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.DELETED_CLIENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'clean_prod_v2');
    localStorage.setItem(STORAGE_KEYS.CLEAN_PROD_V2, 'true');
    localStorage.setItem(STORAGE_KEYS.PAID_DUE_DATE_SYNC_V1, 'true');
    notifyDatabaseChanged();
    return;
  }

  // Reconcile clients already marked as paid so their due_date is cleared ("Sem vencimento")
  const isPaidSynced = localStorage.getItem(STORAGE_KEYS.PAID_DUE_DATE_SYNC_V1);
  if (!isPaidSynced) {
    const clients = safeGet<Client[]>(STORAGE_KEYS.CLIENTS, []);
    const records = safeGet<ServiceRecord[]>(STORAGE_KEYS.SERVICE_RECORDS, []);
    let changed = false;
    const updatedClients = clients.map(c => {
      if (!c || !c.due_date) return c;
      const clientRecords = records.filter(r => r && r.client_id === c.id);
      const hasPaidRecord = clientRecords.some(r => r.payment_status === 'Pago');
      const hasPendingRecord = clientRecords.some(
        r => r.payment_status === 'Pendente' || (r.final_price > (r.amount_paid || 0))
      );
      if (hasPaidRecord && !hasPendingRecord) {
        changed = true;
        return { ...c, due_date: '', updated_at: new Date().toISOString() };
      }
      return c;
    });
    localStorage.setItem(STORAGE_KEYS.PAID_DUE_DATE_SYNC_V1, 'true');
    if (changed) {
      safeSet(STORAGE_KEYS.CLIENTS, updatedClients);
    }
  }
}

export function clearAllDataToZero(): void {
  lastMutationTime = Date.now();
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(BLANK_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.POOLS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SERVICE_RECORDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DELETED_CLIENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'clean_prod_v2');
  localStorage.setItem(STORAGE_KEYS.CLEAN_PROD_V2, 'true');
  clearChatMessages();
  notifyDatabaseChanged();

  // Also wipe backend database file
  try {
    fetch('/api/db/reset', { method: 'POST' }).catch(() => {});
  } catch {}
}

export function loadDemoData(): void {
  lastMutationTime = Date.now();
  localStorage.setItem(STORAGE_KEYS.DELETED_CLIENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEMO_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
  localStorage.setItem(STORAGE_KEYS.POOLS, JSON.stringify(INITIAL_POOLS));
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
  localStorage.setItem(STORAGE_KEYS.SERVICE_RECORDS, JSON.stringify(INITIAL_RECORDS));
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(INITIAL_FEEDBACK));
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'demo');
  notifyDatabaseChanged();
  triggerServerSync();
}

export const resetDatabase = clearAllDataToZero;
export const resetToInitialData = loadDemoData;

// --- CLIENTS ---
export function getClients(): Client[] {
  const deletedSet = new Set(getDeletedClientIds());
  return safeGet<Client[]>(STORAGE_KEYS.CLIENTS, []).filter(
    c => c && c.id && !deletedSet.has(c.id)
  );
}

export function getClientById(id: string): Client | undefined {
  return getClients().find(c => c.id === id);
}

export function createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Client {
  const clients = getClients();
  const newClient: Client = {
    ...clientData,
    whatsapp: clientData.whatsapp ? clientData.whatsapp.trim() : '',
    due_date: clientData.due_date || '',
    id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  safeSet(STORAGE_KEYS.CLIENTS, [newClient, ...clients]);
  if (syncChannel) {
    syncChannel.postMessage('db_updated');
  }
  return newClient;
}

export function updateClient(id: string, updates: Partial<Client>): Client | null {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === id);
  if (index === -1) return null;
  const updated: Client = {
    ...clients[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  clients[index] = updated;
  safeSet(STORAGE_KEYS.CLIENTS, clients);
  return updated;
}

export function deleteClient(id: string): boolean {
  lastMutationTime = Date.now();
  isMutating = true;

  // Registra o ID deletado para bloquear restauração acidental em sincronizações concorrentes
  addDeletedClientId(id);

  // Hard Delete local do cliente e todos os registros dependentes (cascata)
  const clients = safeGet<Client[]>(STORAGE_KEYS.CLIENTS, []).filter(c => c && c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));

  const pools = safeGet<Pool[]>(STORAGE_KEYS.POOLS, []).filter(p => p && p.client_id !== id);
  localStorage.setItem(STORAGE_KEYS.POOLS, JSON.stringify(pools));

  const apps = safeGet<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []).filter(
    a => a && a.client_id !== id
  );
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(apps));

  const allRecords = safeGet<ServiceRecord[]>(STORAGE_KEYS.SERVICE_RECORDS, []);
  const removedRecordIds = new Set(allRecords.filter(r => r && r.client_id === id).map(r => r.id));
  const records = allRecords.filter(r => r && r.client_id !== id);
  localStorage.setItem(STORAGE_KEYS.SERVICE_RECORDS, JSON.stringify(records));

  const payments = safeGet<Payment[]>(STORAGE_KEYS.PAYMENTS, []).filter(
    p => p && p.client_id !== id && !removedRecordIds.has(p.service_record_id)
  );
  localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));

  const feedback = safeGet<ClientFeedback[]>(STORAGE_KEYS.FEEDBACK, []).filter(
    f => f && f.client_id !== id
  );
  localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(feedback));

  const notifications = safeGet<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []).filter(
    n => n && n.client_id !== id
  );
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));

  notifyDatabaseChanged();

  // Directly notify backend hard-delete + full snapshot sync
  fetch(`/api/db/clients/${encodeURIComponent(id)}`, { method: 'DELETE' })
    .catch(() => {})
    .finally(() => {
      isMutating = false;
      lastMutationTime = Date.now();
      triggerServerSync();
    });

  return true;
}

// --- POOLS ---
export function getPools(): Pool[] {
  return safeGet<Pool[]>(STORAGE_KEYS.POOLS, []);
}

export function getPoolsByClientId(clientId: string): Pool[] {
  return getPools().filter(p => p.client_id === clientId);
}

export function getPoolById(id: string): Pool | undefined {
  return getPools().find(p => p.id === id);
}

export function createPool(poolData: Omit<Pool, 'id' | 'created_at'>): Pool {
  const pools = getPools();
  const newPool: Pool = {
    ...poolData,
    photo_url:
      poolData.photo_url && poolData.photo_url.trim() !== ''
        ? poolData.photo_url.trim()
        : getDefaultPoolImageByType(poolData.type, poolData.name),
    id: `pool-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };
  safeSet(STORAGE_KEYS.POOLS, [newPool, ...pools]);
  return newPool;
}

export function updatePool(id: string, updates: Partial<Pool>): Pool | null {
  const pools = getPools();
  const index = pools.findIndex(p => p.id === id);
  if (index === -1) return null;
  const updated: Pool = { ...pools[index], ...updates };
  pools[index] = updated;
  safeSet(STORAGE_KEYS.POOLS, pools);
  return updated;
}

export function deletePool(id: string): boolean {
  addDeletedEntityId(id);
  const pools = getPools().filter(p => p.id !== id);
  safeSet(STORAGE_KEYS.POOLS, pools);
  return true;
}

// --- SERVICES (CATALOG) ---
export function getServices(): ServiceItem[] {
  return safeGet<ServiceItem[]>(STORAGE_KEYS.SERVICES, []);
}

export function getServiceById(id: string): ServiceItem | undefined {
  return getServices().find(s => s.id === id);
}

export function createService(serviceData: Omit<ServiceItem, 'id' | 'created_at'>): ServiceItem {
  const services = getServices();
  const newService: ServiceItem = {
    ...serviceData,
    id: `serv-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  safeSet(STORAGE_KEYS.SERVICES, [newService, ...services]);
  return newService;
}

export function updateService(id: string, updates: Partial<ServiceItem>): ServiceItem | null {
  const services = getServices();
  const index = services.findIndex(s => s.id === id);
  if (index === -1) return null;
  const updated: ServiceItem = { ...services[index], ...updates };
  services[index] = updated;
  safeSet(STORAGE_KEYS.SERVICES, services);
  return updated;
}

export function deleteService(id: string): boolean {
  addDeletedEntityId(id);
  const services = getServices().filter(s => s.id !== id);
  safeSet(STORAGE_KEYS.SERVICES, services);
  return true;
}

// --- APPOINTMENTS (AGENDA) ---
export function getAppointments(): Appointment[] {
  return safeGet<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, []);
}

export function getAppointmentById(id: string): Appointment | undefined {
  return getAppointments().find(a => a.id === id);
}

export function createAppointment(data: Omit<Appointment, 'id' | 'created_at'>): Appointment {
  const appointments = getAppointments();
  const newAppointment: Appointment = {
    ...data,
    id: `app-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  safeSet(STORAGE_KEYS.APPOINTMENTS, [newAppointment, ...appointments]);
  return newAppointment;
}

export function updateAppointment(id: string, updates: Partial<Appointment>): Appointment | null {
  const appointments = getAppointments();
  const index = appointments.findIndex(a => a.id === id);
  if (index === -1) return null;
  const updated: Appointment = { ...appointments[index], ...updates };
  appointments[index] = updated;
  safeSet(STORAGE_KEYS.APPOINTMENTS, appointments);
  return updated;
}

export function deleteAppointment(id: string): boolean {
  addDeletedEntityId(id);
  const appointments = getAppointments().filter(a => a.id !== id);
  safeSet(STORAGE_KEYS.APPOINTMENTS, appointments);
  return true;
}

// --- SERVICE RECORDS (EXECUTION / COMPROVANTES) ---
export function getServiceRecords(): ServiceRecord[] {
  return safeGet<ServiceRecord[]>(STORAGE_KEYS.SERVICE_RECORDS, []);
}

export function getServiceRecordById(id: string): ServiceRecord | undefined {
  return getServiceRecords().find(r => r.id === id);
}

export function createServiceRecord(data: Omit<ServiceRecord, 'id' | 'created_at'>): ServiceRecord {
  const records = getServiceRecords();
  // Auto-generate serial receipt number (e.g. REC-1001)
  const nextNum = 1000 + records.length + 1;
  const newRecord: ServiceRecord = {
    ...data,
    id: `rec-${nextNum}`,
    created_at: new Date().toISOString(),
  };
  safeSet(STORAGE_KEYS.SERVICE_RECORDS, [newRecord, ...records]);

  // If there's an initial payment recorded
  if (newRecord.amount_paid > 0) {
    createPayment({
      service_record_id: newRecord.id,
      amount: newRecord.amount_paid,
      payment_method: newRecord.payment_method,
      payment_date: newRecord.service_date,
      notes: `Pagamento inicial (${newRecord.payment_status})`,
    });
  }

  // If was associated with an appointment, mark appointment as 'Concluído'
  if (data.appointment_id) {
    updateAppointment(data.appointment_id, { status: 'Concluído' });
  }

  // When a service record is added as 'Pago', clear the client's due_date ("Sem vencimento")
  if (newRecord.payment_status === 'Pago') {
    clearClientDueDateIfAllPaid(newRecord.client_id);
  }

  return newRecord;
}

export function clearClientDueDateIfAllPaid(clientId: string): void {
  if (!clientId) return;
  const clientRecords = getServiceRecords().filter(r => r.client_id === clientId);
  const hasPending = clientRecords.some(
    r => r.payment_status !== 'Pago' && r.final_price > (r.amount_paid || 0)
  );
  if (!hasPending) {
    updateClient(clientId, { due_date: '' });
  }
}

export function markClientAsPaid(clientId: string): Client | null {
  const client = getClientById(clientId);
  if (!client) return null;

  // Settle any pending service records for this client
  const clientRecords = getServiceRecords().filter(
    r => r.client_id === clientId && (r.payment_status !== 'Pago' || r.final_price > (r.amount_paid || 0))
  );
  clientRecords.forEach(rec => {
    updatePaymentStatus(rec.id, 'Pago', rec.final_price);
  });

  // Leave the client without due date ("Sem vencimento")
  return updateClient(clientId, { due_date: '' });
}

export function updateServiceRecord(id: string, updates: Partial<ServiceRecord>): ServiceRecord | null {
  const records = getServiceRecords();
  const index = records.findIndex(r => r.id === id);
  if (index === -1) return null;
  const updated: ServiceRecord = { ...records[index], ...updates };
  records[index] = updated;
  safeSet(STORAGE_KEYS.SERVICE_RECORDS, records);

  if (updated.payment_status === 'Pago') {
    clearClientDueDateIfAllPaid(updated.client_id);
  }

  return updated;
}

export function deleteServiceRecord(id: string): boolean {
  addDeletedEntityId(id);
  const records = getServiceRecords().filter(r => r.id !== id);
  safeSet(STORAGE_KEYS.SERVICE_RECORDS, records);
  // Also delete associated payments
  const paymentsToRemove = getPayments().filter(p => p.service_record_id === id);
  paymentsToRemove.forEach(p => addDeletedEntityId(p.id));
  const payments = getPayments().filter(p => p.service_record_id !== id);
  safeSet(STORAGE_KEYS.PAYMENTS, payments);
  return true;
}

// --- PAYMENTS ---
export function getPayments(): Payment[] {
  return safeGet<Payment[]>(STORAGE_KEYS.PAYMENTS, []);
}

export function getPaymentsByRecordId(recordId: string): Payment[] {
  return getPayments().filter(p => p.service_record_id === recordId);
}

export function createPayment(data: Omit<Payment, 'id' | 'created_at'>): Payment {
  const payments = getPayments();
  const newPayment: Payment = {
    ...data,
    id: `pay-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  safeSet(STORAGE_KEYS.PAYMENTS, [newPayment, ...payments]);

  // Recalculate service record paid amount and status
  const record = getServiceRecordById(data.service_record_id);
  if (record) {
    const allRecordPayments = [...getPaymentsByRecordId(data.service_record_id), newPayment];
    const totalPaid = allRecordPayments.reduce((sum, p) => sum + p.amount, 0);
    const newStatus: ServiceRecord['payment_status'] =
      totalPaid >= record.final_price
        ? 'Pago'
        : totalPaid > 0
        ? 'Parcial'
        : 'Pendente';

    updateServiceRecord(record.id, {
      amount_paid: totalPaid,
      payment_status: newStatus,
    });
  }

  return newPayment;
}

export function deletePayment(id: string): boolean {
  const payment = getPayments().find(p => p.id === id);
  if (!payment) return false;
  addDeletedEntityId(id);
  const payments = getPayments().filter(p => p.id !== id);
  safeSet(STORAGE_KEYS.PAYMENTS, payments);

  // Recalculate
  const record = getServiceRecordById(payment.service_record_id);
  if (record) {
    const remainingPayments = payments.filter(p => p.service_record_id === record.id);
    const totalPaid = remainingPayments.reduce((sum, p) => sum + p.amount, 0);
    const newStatus: ServiceRecord['payment_status'] =
      totalPaid >= record.final_price
        ? 'Pago'
        : totalPaid > 0
        ? 'Parcial'
        : 'Pendente';
    updateServiceRecord(record.id, {
      amount_paid: totalPaid,
      payment_status: newStatus,
    });
  }

  return true;
}

// --- EXPENSES ---
export function getExpenses(): ExpenseRecord[] {
  return safeGet<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, []);
}

export function createExpense(data: Omit<ExpenseRecord, 'id' | 'created_at'>): ExpenseRecord {
  const expenses = getExpenses();
  const newExpense: ExpenseRecord = {
    ...data,
    id: `exp-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  safeSet(STORAGE_KEYS.EXPENSES, [newExpense, ...expenses]);
  return newExpense;
}

export function deleteExpense(id: string): boolean {
  addDeletedEntityId(id);
  const expenses = getExpenses().filter(e => e.id !== id);
  safeSet(STORAGE_KEYS.EXPENSES, expenses);
  return true;
}

export function updatePaymentStatus(
  recordId: string,
  newStatus: ServiceRecord['payment_status'],
  amountPaid?: number
): ServiceRecord | null {
  const record = getServiceRecordById(recordId);
  if (!record) return null;

  const finalPaid = amountPaid !== undefined ? amountPaid : newStatus === 'Pago' ? record.final_price : record.amount_paid;

  // Create payment record if newly paid
  if (finalPaid > (record.amount_paid || 0)) {
    createPayment({
      service_record_id: record.id,
      amount: finalPaid - (record.amount_paid || 0),
      payment_method: record.payment_method || 'Pix',
      payment_date: new Date().toISOString().split('T')[0],
      notes: `Baixa de pagamento (${newStatus})`,
    });
  }

  const updatedRecord = updateServiceRecord(recordId, {
    payment_status: newStatus,
    amount_paid: finalPaid,
  });

  if (newStatus === 'Pago') {
    clearClientDueDateIfAllPaid(record.client_id);
  }

  return updatedRecord;
}

// --- SETTINGS ---
export function getCompanySettings(): CompanySettings {
  return safeGet<CompanySettings>(STORAGE_KEYS.SETTINGS, BLANK_SETTINGS);
}

export function updateCompanySettings(updates: Partial<CompanySettings>): CompanySettings {
  const current = getCompanySettings();
  const updated = { ...current, ...updates };
  safeSet(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

export const saveCompanySettings = (settings: CompanySettings) => {
  safeSet(STORAGE_KEYS.SETTINGS, settings);
  return settings;
};

// Export / Import Backup
export function exportDatabaseJSON(): string {
  const data = {
    settings: getCompanySettings(),
    clients: getClients(),
    pools: getPools(),
    services: getServices(),
    appointments: getAppointments(),
    service_records: getServiceRecords(),
    payments: getPayments(),
    expenses: getExpenses(),
    feedbacks: getFeedbacks(),
    notifications: getNotifications(),
    exported_at: new Date().toISOString(),
    version: '1.1.0',
  };
  return JSON.stringify(data, null, 2);
}

export function importDatabaseJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.settings) safeSet(STORAGE_KEYS.SETTINGS, data.settings);
    if (data.clients) safeSet(STORAGE_KEYS.CLIENTS, data.clients);
    if (data.pools) safeSet(STORAGE_KEYS.POOLS, data.pools);
    if (data.services) safeSet(STORAGE_KEYS.SERVICES, data.services);
    if (data.appointments) safeSet(STORAGE_KEYS.APPOINTMENTS, data.appointments);
    if (data.service_records) safeSet(STORAGE_KEYS.SERVICE_RECORDS, data.service_records);
    if (data.payments) safeSet(STORAGE_KEYS.PAYMENTS, data.payments);
    if (data.expenses) safeSet(STORAGE_KEYS.EXPENSES, data.expenses);
    if (data.feedbacks) safeSet(STORAGE_KEYS.FEEDBACK, data.feedbacks);
    if (data.notifications) safeSet(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
    notifyDatabaseChanged();
    return true;
  } catch (err) {
    console.error('Import failed', err);
    return false;
  }
}

// --- FEEDBACK & SATISFACTION ---
export function getFeedbacks(): ClientFeedback[] {
  return safeGet<ClientFeedback[]>(STORAGE_KEYS.FEEDBACK, []);
}

export function getFeedbackById(id: string): ClientFeedback | undefined {
  return getFeedbacks().find(f => f.id === id);
}

export function getFeedbacksByClientId(clientId: string): ClientFeedback[] {
  return getFeedbacks().filter(f => f.client_id === clientId);
}

export function getFeedbackByServiceRecordId(recordId: string): ClientFeedback | undefined {
  return getFeedbacks().find(f => f.service_record_id === recordId);
}

export function createFeedback(
  data: Omit<ClientFeedback, 'id' | 'created_at'>
): ClientFeedback {
  const feedbacks = getFeedbacks();
  const client = getClientById(data.client_id);
  const pool = data.pool_id ? getPoolById(data.pool_id) : undefined;
  const record = data.service_record_id ? getServiceRecordById(data.service_record_id) : undefined;

  const newFeedback: ClientFeedback = {
    ...data,
    id: `fb-${Date.now()}`,
    client_name: data.client_name || client?.name || 'Cliente',
    pool_name: data.pool_name || pool?.name || 'Piscina',
    service_name: data.service_name || record?.description || 'Serviço Realizado',
    created_at: new Date().toISOString(),
  };

  const updated = [newFeedback, ...feedbacks];
  safeSet(STORAGE_KEYS.FEEDBACK, updated);

  // Trigger automated notification for high or noteworthy rating
  createNotification({
    type: 'feedback',
    title: `Nova Avaliação: ${newFeedback.rating} Estrelas ⭐`,
    message: `${newFeedback.client_name} avaliou o serviço: "${newFeedback.comment ? newFeedback.comment.slice(0, 75) + (newFeedback.comment.length > 75 ? '...' : '') : 'Avaliação registrada'}"`,
    priority: newFeedback.rating >= 4 ? 'medium' : 'high',
    entity_type: 'feedback',
    entity_id: newFeedback.id,
    action_page: 'relatorios',
    client_id: newFeedback.client_id,
  });

  return newFeedback;
}

export function updateFeedback(
  id: string,
  updates: Partial<ClientFeedback>
): ClientFeedback | undefined {
  const feedbacks = getFeedbacks();
  const index = feedbacks.findIndex(f => f.id === id);
  if (index === -1) return undefined;

  const updated = {
    ...feedbacks[index],
    ...updates,
  };

  feedbacks[index] = updated;
  safeSet(STORAGE_KEYS.FEEDBACK, [...feedbacks]);
  return updated;
}

export function deleteFeedback(id: string): boolean {
  addDeletedEntityId(id);
  const feedbacks = getFeedbacks().filter(f => f.id !== id);
  safeSet(STORAGE_KEYS.FEEDBACK, feedbacks);
  return true;
}

// --- PUSH NOTIFICATIONS SYSTEM ---
export function getNotifications(): AppNotification[] {
  return safeGet<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
}

export function getUnreadNotificationsCount(): number {
  return getNotifications().filter(n => !n.read).length;
}

export function createNotification(
  data: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & {
    id?: string;
    read?: boolean;
    timestamp?: string;
  }
): AppNotification {
  const notifications = getNotifications();

  // Avoid creating identical duplicate notifications within the same day
  const isDuplicate = notifications.some(
    n => n.type === data.type && n.entity_id === data.entity_id && n.title === data.title
  );

  if (isDuplicate) {
    const existing = notifications.find(
      n => n.type === data.type && n.entity_id === data.entity_id && n.title === data.title
    );
    if (existing) return existing;
  }

  const newNotif: AppNotification = {
    id: data.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: data.type,
    title: data.title,
    message: data.message,
    timestamp: data.timestamp || new Date().toISOString(),
    read: data.read !== undefined ? data.read : false,
    priority: data.priority || 'medium',
    entity_type: data.entity_type,
    entity_id: data.entity_id,
    action_page: data.action_page,
    client_id: data.client_id,
  };

  const updated = [newNotif, ...notifications];
  safeSet(STORAGE_KEYS.NOTIFICATIONS, updated);

  // Trigger native browser notification if granted
  try {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`Venâncio Piscinas: ${newNotif.title}`, {
        body: newNotif.message,
        icon: '/favicon.ico',
      });
    }
  } catch {}

  return newNotif;
}

export function markNotificationAsRead(id: string): void {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index] = { ...notifications[index], read: true };
    safeSet(STORAGE_KEYS.NOTIFICATIONS, [...notifications]);
  }
}

export function markAllNotificationsAsRead(): void {
  const notifications = getNotifications().map(n => ({ ...n, read: true }));
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

export function deleteNotification(id: string): boolean {
  addDeletedEntityId(id);
  const notifications = getNotifications().filter(n => n.id !== id);
  safeSet(STORAGE_KEYS.NOTIFICATIONS, notifications);
  return true;
}

export function clearAllNotifications(): void {
  safeSet(STORAGE_KEYS.NOTIFICATIONS, []);
}

// Operational scanner: checks for today's appointments and overdue payments
export function checkOperationalAlerts(): void {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // 1. Check appointments for today
  const appointments = getAppointments();
  const todayApps = appointments.filter(a => a.date === todayStr && a.status !== 'Concluído' && a.status !== 'Cancelado');
  todayApps.forEach(app => {
    const client = getClientById(app.client_id);
    const service = getServices().find(s => s.id === app.service_id);
    createNotification({
      type: 'appointment',
      title: `Atendimento Hoje às ${app.time}`,
      message: `${client?.name || 'Cliente'} - ${service?.name || 'Serviço agendado'} (${app.time})`,
      priority: 'high',
      entity_type: 'appointment',
      entity_id: app.id,
      action_page: 'agenda',
      client_id: app.client_id,
    });
  });

  // 2. Check overdue payments
  const records = getServiceRecords();
  const pendingRecords = records.filter(r => r.payment_status === 'Pendente' || (r.payment_status === 'Parcial' && (r.amount_paid || 0) < r.final_price));
  pendingRecords.forEach(rec => {
    const client = getClientById(rec.client_id);
    const diff = rec.final_price - (rec.amount_paid || 0);
    createNotification({
      type: 'overdue_payment',
      title: `Pagamento Pendente: R$ ${diff.toFixed(2)}`,
      message: `${client?.name || 'Cliente'} possui valor em aberto do serviço de ${rec.service_date}.`,
      priority: 'high',
      entity_type: 'payment',
      entity_id: rec.id,
      action_page: 'financeiro',
      client_id: rec.client_id,
    });
  });
}

// ================= CHAT HISTORY STORAGE =================
const CHAT_STORAGE_KEY = 'venancio_piscinas_chat_messages_v1';

export function getChatMessages(): any[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveChatMessages(messages: any[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save chat messages', err);
  }
}

export function clearChatMessages(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear chat messages', err);
  }
}

