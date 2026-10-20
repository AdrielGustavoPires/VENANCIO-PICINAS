import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { initDatabase, syncWithServer } from './database/storage';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { Pools } from './pages/Pools';
import { ServicesCatalog } from './pages/ServicesCatalog';
import { Schedule } from './pages/Schedule';
import { Financial } from './pages/Financial';
import { Receipts } from './pages/Receipts';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Chat } from './pages/Chat';
import { ChatFloatingWidget } from './components/chat/ChatFloatingWidget';

// Global Modals
import { RecordServiceModal } from './components/services/RecordServiceModal';
import { AppointmentModal } from './components/appointments/AppointmentModal';
import { ReceiptModal } from './components/receipts/ReceiptModal';
import { PoolModal } from './components/pools/PoolModal';
import { ClientModal } from './components/clients/ClientModal';

type AppPage =
  | 'dashboard'
  | 'clients'
  | 'clientes'
  | 'pools'
  | 'piscinas'
  | 'services'
  | 'servicos'
  | 'appointments'
  | 'agenda'
  | 'financial'
  | 'financeiro'
  | 'receipts'
  | 'comprovantes'
  | 'reports'
  | 'relatorios'
  | 'chat'
  | 'assistente'
  | 'settings'
  | 'configuracoes';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    initDatabase();
    syncWithServer();
  }, []);

  // Navigation State
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Global Quick Action Modals
  const [isQuickRecordServiceOpen, setIsQuickRecordServiceOpen] = useState(false);
  const [quickServiceClientId, setQuickServiceClientId] = useState<string | undefined>(undefined);
  const [quickServicePoolId, setQuickServicePoolId] = useState<string | undefined>(undefined);

  const [isQuickAppointmentOpen, setIsQuickAppointmentOpen] = useState(false);
  const [quickAppointmentClientId, setQuickAppointmentClientId] = useState<string | undefined>(undefined);

  const [viewReceiptId, setViewReceiptId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-sky-600">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Carregando Venâncio Piscinas...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleNavigate = (page: string) => {
    setSelectedClientId(null);
    setCurrentPage(page as AppPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenNewService = (clientId?: string, poolId?: string) => {
    setQuickServiceClientId(clientId);
    setQuickServicePoolId(poolId);
    setIsQuickRecordServiceOpen(true);
  };

  const handleOpenNewAppointment = (clientId?: string) => {
    setQuickAppointmentClientId(clientId);
    setIsQuickAppointmentOpen(true);
  };

  const handleViewReceipt = (recordId: string) => {
    setViewReceiptId(recordId);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <Sidebar
        currentPage={selectedClientId ? 'clientes' : currentPage}
        onNavigate={handleNavigate}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentPage={selectedClientId ? 'clientes' : currentPage}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header */}
        <Header
          currentPage={selectedClientId ? 'clientes' : currentPage}
          onNavigate={handleNavigate}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          onOpenNewService={() => handleOpenNewService()}
          onOpenNewAppointment={() => handleOpenNewAppointment()}
        />

        {/* Dynamic Page Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {/* If a client is selected, show Client Detail */}
          {selectedClientId ? (
            <ClientDetail
              clientId={selectedClientId}
              onBack={() => setSelectedClientId(null)}
              onOpenNewService={(cId, pId) => handleOpenNewService(cId, pId)}
              onOpenNewAppointment={cId => handleOpenNewAppointment(cId)}
              onViewReceipt={handleViewReceipt}
            />
          ) : (
            <>
              {currentPage === 'dashboard' && (
                <Dashboard
                  onNavigate={handleNavigate}
                  onSelectClient={handleSelectClient}
                  onOpenNewService={handleOpenNewService}
                  onOpenNewAppointment={handleOpenNewAppointment}
                  onViewReceipt={handleViewReceipt}
                />
              )}

              {(currentPage === 'clients' || currentPage === 'clientes') && (
                <Clients
                  onSelectClient={handleSelectClient}
                  onOpenNewServiceForClient={cId => handleOpenNewService(cId)}
                />
              )}

              {(currentPage === 'pools' || currentPage === 'piscinas') && (
                <Pools
                  onSelectClient={handleSelectClient}
                  onOpenNewService={(cId, pId) => handleOpenNewService(cId, pId)}
                />
              )}

              {(currentPage === 'services' || currentPage === 'servicos') && (
                <ServicesCatalog />
              )}

              {(currentPage === 'appointments' || currentPage === 'agenda') && (
                <Schedule onSelectClient={handleSelectClient} />
              )}

              {(currentPage === 'financial' || currentPage === 'financeiro') && (
                <Financial />
              )}

              {(currentPage === 'receipts' || currentPage === 'comprovantes') && (
                <Receipts onSelectClient={handleSelectClient} />
              )}

              {(currentPage === 'reports' || currentPage === 'relatorios') && (
                <Reports />
              )}

              {(currentPage === 'chat' || currentPage === 'assistente') && (
                <Chat onSelectClient={handleSelectClient} />
              )}

              {(currentPage === 'settings' || currentPage === 'configuracoes') && (
                <Settings />
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating AI Chat Assistant Widget */}
      <ChatFloatingWidget
        onNavigateToChatPage={() => handleNavigate('chat')}
        currentPage={currentPage}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        currentPage={selectedClientId ? 'clientes' : currentPage}
        onNavigate={handleNavigate}
        onOpenNewService={() => handleOpenNewService()}
      />

      {/* Global Service Record Modal */}
      <RecordServiceModal
        isOpen={isQuickRecordServiceOpen}
        onClose={() => {
          setIsQuickRecordServiceOpen(false);
          setQuickServiceClientId(undefined);
          setQuickServicePoolId(undefined);
        }}
        prefillClientId={quickServiceClientId}
        prefillPoolId={quickServicePoolId}
        onServiceRecorded={rec => {
          setViewReceiptId(rec.id);
        }}
      />

      {/* Global Appointment Modal */}
      <AppointmentModal
        isOpen={isQuickAppointmentOpen}
        onClose={() => {
          setIsQuickAppointmentOpen(false);
          setQuickAppointmentClientId(undefined);
        }}
        defaultClientId={quickAppointmentClientId}
      />

      {/* Global Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(viewReceiptId)}
        onClose={() => setViewReceiptId(null)}
        recordId={viewReceiptId}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
