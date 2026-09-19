import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { QuickIngestModal } from './components/QuickIngestModal';
import { AuthModal } from './components/AuthModal';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { TransactionMonitoring } from './pages/TransactionMonitoring';
import { TransactionDetailModal } from './pages/TransactionDetailModal';
import { AlertsPage } from './pages/AlertsPage';
import { CaseManagement } from './pages/CaseManagement';
import { InvestigationWorkflow } from './pages/InvestigationWorkflow';
import { FraudGraphPage } from './pages/FraudGraphPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { ModelEvaluationPage } from './pages/ModelEvaluationPage';
import { AnalystFeedbackPage } from './pages/AnalystFeedbackPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import { Transaction } from './types/fraud';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const selectedCaseIdRef = useRef<string | null>(null);
  selectedCaseIdRef.current = selectedCaseId;

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(true);

  // Badge counts
  const [alertCount, setAlertCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const [alerts, cases, health] = await Promise.all([
        api.getAlerts(),
        api.getCases(),
        api.getHealth()
      ]);
      if (Array.isArray(alerts)) {
        setAlertCount(alerts.length);
      }
      if (Array.isArray(cases)) {
        setCaseCount(cases.filter(c => c.status !== 'CONFIRMED_FRAUD' && c.status !== 'FALSE_POSITIVE').length);
        if (cases.length > 0 && !selectedCaseIdRef.current) {
          setSelectedCaseId(cases[0].id);
        }
      }
      if (health?.kafka) {
        setIsSimulating(health.kafka.isSimulating ?? true);
      }
    } catch (e) {
      console.warn('Failed to fetch badge counts:', e);
    }
  }, []);

  useEffect(() => {
    fetchBadgeCounts();
    const timer = setInterval(fetchBadgeCounts, 10000);
    return () => clearInterval(timer);
  }, [fetchBadgeCounts]);

  const handleOpenInvestigation = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveTab('investigation');
  };

  const handleNavigate = (page: string, id?: string) => {
    let target = page;
    if (page === 'dashboard') target = 'overview';
    if (page === 'fraud-graph') target = 'graph';
    if (page === 'models') target = 'evaluation';
    if (target === 'investigation' && id) {
      setSelectedCaseId(id);
    }
    setActiveTab(target);
  };

  const handleToggleSimulation = async () => {
    try {
      const res = await api.toggleSimulation();
      setIsSimulating(res.isSimulating);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen bg-[#090D16] text-slate-100 antialiased overflow-hidden selection:bg-indigo-500 selection:text-white font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={alertCount}
        caseCount={caseCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          activeAlertsCount={alertCount}
          isSimulating={isSimulating}
          onOpenIngestModal={() => setIsIngestModalOpen(true)}
          onNavigate={handleNavigate}
          onToggleSimulation={handleToggleSimulation}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          currentUser={currentUser}
        />

        {/* View Routing */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0B101D] to-[#070A12]">
          {activeTab === 'overview' && (
            <OverviewDashboard
              onNavigate={handleNavigate}
              onOpenInvestigation={handleOpenInvestigation}
              onSelectTransaction={tx => setSelectedTransaction(tx)}
              onOpenIngestModal={() => setIsIngestModalOpen(true)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionMonitoring
              onSelectTransaction={tx => setSelectedTransaction(tx)}
              onOpenIngestModal={() => setIsIngestModalOpen(true)}
            />
          )}

          {activeTab === 'alerts' && (
            <AlertsPage
              onOpenInvestigation={handleOpenInvestigation}
              onSelectTransaction={tx => setSelectedTransaction(tx)}
            />
          )}

          {activeTab === 'cases' && (
            <CaseManagement
              onOpenInvestigation={handleOpenInvestigation}
              onOpenIngestModal={() => setIsIngestModalOpen(true)}
            />
          )}

          {activeTab === 'investigation' && (
            <InvestigationWorkflow
              caseId={selectedCaseId || 'CASE-2026-001'}
              onBack={() => setActiveTab('cases')}
              onRefresh={fetchBadgeCounts}
            />
          )}

          {activeTab === 'graph' && (
            <FraudGraphPage />
          )}

          {activeTab === 'rag' && (
            <KnowledgeBasePage />
          )}

          {activeTab === 'evaluation' && (
            <ModelEvaluationPage />
          )}

          {activeTab === 'feedback' && (
            <AnalystFeedbackPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Modals */}
      <QuickIngestModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onTransactionCreated={tx => {
          fetchBadgeCounts();
          setSelectedTransaction(tx);
        }}
        onTransactionIngested={tx => {
          fetchBadgeCounts();
          setSelectedTransaction(tx);
        }}
        onOpenInvestigation={caseId => {
          handleOpenInvestigation(caseId);
        }}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        onOpenInvestigation={caseId => {
          setSelectedTransaction(null);
          handleOpenInvestigation(caseId);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
      />
    </div>
  );
}
