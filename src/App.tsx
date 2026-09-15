import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DocumentUpload } from './components/DocumentUpload';
import { ChatInterface } from './components/ChatInterface';
import { PipelineInspector } from './components/PipelineInspector';
import { SourceViewerModal } from './components/SourceViewerModal';
import { SettingsModal } from './components/SettingsModal';
import { DatabaseSyncModal } from './components/DatabaseSyncModal';
import { ProcessedDocument, TextChunk, ChatMessage, SearchResult, PipelineStageInfo, AppSettings } from './types/rag';
import { vectorStore } from './services/rag/vectorStore';
import { routeAndAnswerQuery, QueryDomain } from './services/rag/queryRouter';
import { chunkDocument } from './services/rag/chunker';
import { generateEmbedding } from './services/rag/embeddings';
import { SAMPLE_DOCUMENTS } from './data/sampleDocuments';
import { schoolDataRepository, DatabaseStatus } from './services/school/schoolDataRepository';
import { apiKeyPool } from './services/rag/apiKeyPool';

export const App: React.FC = () => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'inspector'>('chat');
  const [activePipelineInfo, setActivePipelineInfo] = useState<PipelineStageInfo | null>(null);
  const [selectedSource, setSelectedSource] = useState<SearchResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeDomain, setActiveDomain] = useState<QueryDomain>('auto');
  const [studentCount, setStudentCount] = useState<number>(schoolDataRepository.getStudentCount());
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>(schoolDataRepository.getDatabaseStatus());

  const [settings, setSettings] = useState<AppSettings>({
    geminiApiKey: apiKeyPool.getActiveKey(),
    geminiApiKeyPool: apiKeyPool.getKeys(),
    autoRotateKeys: true,
    chunkSize: 400,
    chunkOverlap: 60,
    topK: 4,
    hybridAlpha: 0.7
  });

  // Load state on mount
  useEffect(() => {
    const savedDocs = localStorage.getItem('rag_documents_metadata_v1');
    if (savedDocs) {
      try {
        const parsed: ProcessedDocument[] = JSON.parse(savedDocs);
        // Retain only user-uploaded documents in the knowledge base list (exclude student records)
        setDocuments(parsed.filter(d => !d.id.startsWith('doc_STU_')));
      } catch (e) {
        console.warn('Failed to parse saved document metadata', e);
      }
    }

    const savedSettings = localStorage.getItem('rag_app_settings_v1');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (!parsed.geminiApiKey || parsed.geminiApiKey.length < 10) {
          parsed.geminiApiKey = apiKeyPool.getActiveKey();
        }
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.warn('Failed to parse saved settings', e);
      }
    }

    // Subscribe to API Key Pool rotations
    const unsubKeyPool = apiKeyPool.subscribe((_, activeKey) => {
      setSettings(prev => prev.geminiApiKey === activeKey ? prev : { ...prev, geminiApiKey: activeKey });
    });

    // Check Postgres connection and fetch active student roster
    schoolDataRepository.checkStatus().then(status => {
      setDbStatus(status);
      if (status.connected) {
        schoolDataRepository.fetchFromPostgres().then(res => {
          setStudentCount(res.count);
        });
      }
    });

    const unsubscribe = schoolDataRepository.subscribe(students => {
      setStudentCount(students.length);
    });

    return () => {
      unsubscribe();
      unsubKeyPool();
    };
  }, []);

  // Sync documents to localStorage
  const saveDocumentsState = (newDocs: ProcessedDocument[]) => {
    // Only persist user-uploaded documents in the document storage
    const userDocs = newDocs.filter(d => !d.id.startsWith('doc_STU_'));
    setDocuments(userDocs);
    localStorage.setItem('rag_documents_metadata_v1', JSON.stringify(userDocs));
  };

  // Handle sync complete from DatabaseModal
  const handleSyncComplete = async () => {
    const s = await schoolDataRepository.checkStatus();
    setDbStatus(s);
    setStudentCount(schoolDataRepository.getStudentCount());
  };

  // Auto-load sample documents
  const handleLoadSamples = async () => {
    setIsLoading(true);
    const loadedDocs: ProcessedDocument[] = [];

    for (const doc of SAMPLE_DOCUMENTS) {
      const chunks = chunkDocument(doc, settings.chunkSize, settings.chunkOverlap);
      for (const chunk of chunks) {
        chunk.vector = await generateEmbedding(chunk.content, settings.geminiApiKey);
      }
      doc.chunksCount = chunks.length;
      vectorStore.addChunks(chunks);
      loadedDocs.push(doc);
    }

    saveDocumentsState([...documents, ...loadedDocs]);
    setIsLoading(false);
  };

  const handleDocumentAdded = (newDoc: ProcessedDocument, chunks: TextChunk[]) => {
    const updated = [newDoc, ...documents.filter(d => d.id !== newDoc.id)];
    saveDocumentsState(updated);
  };

  const handleDocumentDeleted = (docId: string) => {
    vectorStore.removeDocumentChunks(docId);
    const updated = documents.filter(d => d.id !== docId);
    saveDocumentsState(updated);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (newSettings.geminiApiKey) {
      apiKeyPool.setActiveKey(newSettings.geminiApiKey);
    }
    localStorage.setItem('rag_app_settings_v1', JSON.stringify(newSettings));
  };

  const handleSendMessage = async (query: string, domain?: QueryDomain) => {
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const chosenDomain = domain || activeDomain;
      const historyTurns = messages.slice(-6);
      const response = await routeAndAnswerQuery(
        query,
        chosenDomain,
        settings.geminiApiKey,
        settings.topK,
        settings.hybridAlpha,
        historyTurns
      );

      setActivePipelineInfo(response.pipelineInfo);

      const botMsg: ChatMessage = {
        id: `msg_${Date.now()}_a`,
        sender: 'assistant',
        text: response.answer,
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pipelineInfo: response.pipelineInfo,
        domainUsed: response.domainUsed,
        optimizedQuery: response.optimizedQuery
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Q&A Routing & Retrieval Error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_${Date.now()}_err`,
        sender: 'assistant',
        text: `⚠️ Error retrieving answer: ${err.message || 'Unknown error'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadedDocs = documents.filter(d => !d.id.startsWith('doc_STU_'));
  const uploadedChunksCount = vectorStore.getAllChunks().filter(c => !c.docId.startsWith('doc_STU_')).length;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans flex flex-col">
      {/* Top Header */}
      <Header
        docCount={uploadedDocs.length}
        chunkCount={uploadedChunksCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        settings={settings}
        studentCount={studentCount}
        dbStatus={dbStatus}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6">
        {activeTab === 'chat' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Sidebar: Document Manager & Upload */}
            <div className="lg:col-span-4 space-y-6">
              <DocumentUpload
                documents={uploadedDocs}
                onDocumentAdded={handleDocumentAdded}
                onDocumentDeleted={handleDocumentDeleted}
                onLoadSchoolDb={() => setIsDbModalOpen(true)}
                apiKey={settings.geminiApiKey}
                chunkSize={settings.chunkSize}
                chunkOverlap={settings.chunkOverlap}
              />
            </div>

            {/* Right Main Area: Q&A Chat Window */}
            <div className="lg:col-span-8">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onSelectSource={(src) => setSelectedSource(src)}
                onInspectPipeline={(info) => {
                  setActivePipelineInfo(info);
                  setActiveTab('inspector');
                }}
                hasDocuments={uploadedDocs.length > 0}
                activeDomain={activeDomain}
                onDomainChange={setActiveDomain}
                studentCount={studentCount}
                docCount={uploadedDocs.length}
              />
            </div>
          </div>
        ) : (
          /* 7-Stage Pipeline Inspector Tab */
          <PipelineInspector pipelineInfo={activePipelineInfo} />
        )}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <DatabaseSyncModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        onSyncComplete={handleSyncComplete}
        geminiApiKey={settings.geminiApiKey}
      />

      <SourceViewerModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
};

export default App;
