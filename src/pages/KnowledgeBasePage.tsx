import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Upload, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Layers, 
  X,
  Orbit,
  LayoutGrid
} from 'lucide-react';
import { KnowledgeDocument, RagSearchResult } from '../types/fraud';
import { api } from '../services/api';
import { KnowledgeSpace3D } from '../components/3d/KnowledgeSpace3D';

export const KnowledgeBasePage: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('card testing micro-authorizations velocity');
  const [searchResults, setSearchResults] = useState<RagSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | 'grid'>('3d');

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('INTERNAL_POLICY');
  const [uploadContent, setUploadContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
      handleSearch('card testing micro-authorizations velocity');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSearch = async (queryToRun?: string) => {
    const q = queryToRun || searchQuery;
    if (!q.trim()) return;
    setIsSearching(true);
    try {
      const results = await api.searchKnowledgeBase(q, 4);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadTitle || !uploadContent) return;
    setIsUploading(true);
    try {
      await api.uploadDocument({
        title: uploadTitle,
        category: uploadCategory,
        content: uploadContent
      });
      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadContent('');
      await fetchDocs();
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div id="view-knowledge-base" className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              RAG Knowledge Corpus & Citations
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Verified financial regulatory corpus, AML/KYC policies, and historical case vectors for autonomous agent grounding.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === '3d' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Orbit className="h-3.5 w-3.5" />
              <span>Vector Space</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'grid' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid View</span>
            </button>
          </div>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Index New Policy / Case</span>
          </button>
        </div>
      </div>

      {/* 3D Knowledge Embedding Space */}
      {viewMode === '3d' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-2">
              <Orbit className="h-4 w-4 text-purple-400" />
              Multi-Dimensional Vector Embedding Space
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              CLICK ORBS TO GROUND AGENTS
            </span>
          </div>
          <KnowledgeSpace3D
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={(doc) => {
              setSelectedDocId(doc.id);
              setSearchQuery(doc.title);
              handleSearch(doc.title);
            }}
          />
        </div>
      )}

      {/* Interactive RAG Search Sandbox */}
      <div className="p-5 rounded-2xl bg-[#0d0d0d] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white font-mono uppercase">
            <Sparkles className="h-4 w-4 text-red-500" />
            <span>Agent Retrieval Sandbox (Hybrid Vector + Dense Similarity)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Agent Step 4 & 5 Grounding</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Query regulatory policy or fraud typologies (e.g., card testing, velocity bursts, travel rule)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-red-500 font-mono"
            />
          </div>
          <button
            disabled={isSearching}
            onClick={() => handleSearch()}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(229,9,20,0.3)] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? 'Synthesizing...' : 'Execute RAG'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="text-[11px] font-mono text-slate-400 uppercase">
              Top Ranked Semantic Citations ({searchResults.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((res, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate pr-2">{res.documentTitle}</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold shrink-0">
                      {(res.score * 100).toFixed(0)}% MATCH
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {res.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/10">
                    <span>{res.matchReason}</span>
                    <span>Chunk #{res.chunkIndex + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Indexed Document Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Indexed Corpus Repositories ({documents.length} Documents)
          </div>
          <span className="text-xs text-slate-400 font-mono">Zero Hallucination Grounding Corpus</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <div 
              key={doc.id}
              onClick={() => {
                setSelectedDocId(doc.id);
                setSearchQuery(doc.title);
                handleSearch(doc.title);
              }}
              className={`p-5 rounded-2xl bg-[#0d0d0d] border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedDocId === doc.id 
                  ? 'border-red-500 shadow-[0_0_20px_rgba(229,9,20,0.2)]' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-red-400 text-[11px]">{doc.id}</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 font-mono text-[10px] border border-white/10">
                    {doc.category}
                  </span>
                </div>

                <div className="font-bold text-white text-sm leading-snug">
                  {doc.title}
                </div>

                <p className="text-xs text-slate-400 leading-normal line-clamp-3">
                  {doc.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{doc.chunkCount} Chunks Indexed</span>
                <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-[#0e0e0e] border border-white/15 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Upload className="h-4 w-4 text-red-500" />
                <span>Upload Document into Vector Knowledge Base</span>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g., Circular 2026-04: High-Velocity Wire Interception Policy"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={e => setUploadCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-white/10 text-white focus:outline-none focus:border-red-500"
                >
                  <option value="INTERNAL_POLICY">Internal Bank Policy</option>
                  <option value="REGULATORY_FRAMEWORK">Regulatory Framework (FinCEN / FATF)</option>
                  <option value="FRAUD_TYPOLOGY">Fraud Typology & Modus Operandi</option>
                  <option value="HISTORICAL_CASE">Historical Investigation Case Study</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Document Text</label>
                <textarea
                  rows={6}
                  placeholder="Paste complete compliance guidance, rules, or typology specifications..."
                  value={uploadContent}
                  onChange={e => setUploadContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-red-500 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10 text-xs">
              <button
                onClick={() => setIsUploadOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={isUploading || !uploadTitle || !uploadContent}
                onClick={handleUpload}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-50"
              >
                {isUploading ? 'Chunking & Indexing...' : 'Index Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
