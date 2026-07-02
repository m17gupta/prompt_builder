"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ArrowLeft, Save, Plus, GripVertical, Trash2, Edit3, Lock, Unlock, Variable, Search, GitBranch, Notebook, MessageSquare, LayoutTemplate, Layers } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppContext } from '../../../AppContext';

type Chunk = {
  _id: string;
  promptId: string;
  title: string;
  content: string;
  order: number;
  role: string;
  locked?: boolean;
  enabled?: boolean;
};

type VersionItem = {
  _id: string;
  versionNumber: number;
  createdAt: string;
  contentSnapshot: string;
};

type Domain = {
  _id: string;
  name: string;
  variables: Record<string, string>;
};

type Todo = {
  _id?: string;
  id: string;
  text: string;
  done: boolean;
  chunkId?: string;
};

type Prompt = {
  _id: string;
  title: string;
  description: string;
  version: number;
  todos?: Todo[];
  chunkingLogic?: string;
};

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0 }
};

function diffLines(oldStr: string, newStr: string) {
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  
  const dp: number[][] = Array(oldLines.length + 1).fill(0).map(() => Array(newLines.length + 1).fill(0));
  
  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const result: { type: 'added' | 'removed' | 'unchanged', value: string }[] = [];
  let i = oldLines.length;
  let j = newLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'unchanged', value: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', value: newLines[j - 1] });
      j--;
    } else {
      result.unshift({ type: 'removed', value: oldLines[i - 1] });
      i--;
    }
  }
  
  return result;
}

export default function PromptEditorComponent() {
  const { confirm } = useAppContext();
  const params = useParams();
  const id = params?.id as string;
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [activeChunk, setActiveChunk] = useState<Chunk | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showVariables, setShowVariables] = useState(false);
  const [globalVariables, setGlobalVariables] = useState<Record<string, string>>({});
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [compareVersion, setCompareVersion] = useState<VersionItem | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [activeCommentChunkId, setActiveCommentChunkId] = useState<string | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [compareFullscreen, setCompareFullscreen] = useState(false);
  
  const [viewMode, setViewMode] = useState<'branches' | 'document'>('branches');
  const [documentText, setDocumentText] = useState('');
  const [documentHints, setDocumentHints] = useState<{title: string, startIndex: number}[]>([]);
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  
  const docEditorRef = useRef<HTMLTextAreaElement>(null);
  const docPreviewRef = useRef<HTMLDivElement>(null);
  const compareOldRef = useRef<HTMLDivElement>(null);
  const compareNewRef = useRef<HTMLDivElement>(null);

  const handleSyncScroll = (e: React.UIEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    const source = e.target as HTMLElement;
    let target: HTMLElement | null = null;
    
    if (viewMode === 'document') {
        target = source === docEditorRef.current ? docPreviewRef.current : docEditorRef.current;
    } else if (compareVersion) {
        target = source === compareOldRef.current ? compareNewRef.current : compareOldRef.current;
    }
    
    if (!target) return;
    
    const percentage = source.scrollTop / Math.max(1, source.scrollHeight - source.clientHeight);
    target.scrollTop = percentage * Math.max(1, target.scrollHeight - target.clientHeight);
  };
  
  const generateDocumentText = () => {
    let joiner = '\n\n';
    if (prompt?.chunkingLogic) {
        try {
            const parsed = JSON.parse(prompt.chunkingLogic);
            if (parsed.splitMethod === 'kalpline') joiner = '\n\n### -----\n\n';
            else if (parsed.splitMethod === 'paragraphs') joiner = '\n\n';
            else if (parsed.splitMethod === 'headers') joiner = '\n\n';
        } catch(e) {}
    } else {
        joiner = '\n\n### -----\n\n';
    }
    
    const enabledChunks = chunks.filter(c => c.enabled !== false);
    let currentText = '';
    const hints: {title: string, startIndex: number}[] = [];
    
    enabledChunks.forEach((c, idx) => {
       hints.push({ title: c.title, startIndex: currentText.length });
       currentText += c.content;
       if (idx < enabledChunks.length - 1) {
           currentText += joiner;
       }
    });
    
    return { text: currentText, hints };
  };

  useEffect(() => {
     if (viewMode === 'document') {
          const { text, hints } = generateDocumentText();
          setDocumentText(text);
          setDocumentHints(hints);
     }
  }, [viewMode, chunks, prompt]);
  
  const handleDocumentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDocumentText(e.target.value);
  };

  const handleMouseDown = () => {
    isDragging.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    let newWidth = e.clientX;
    if (newWidth < 200) newWidth = 200;
    if (newWidth > 600) newWidth = 600;
    setSidebarWidth(newWidth);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const fetchData = async () => {
    if (!id) return;
    const pRes = await fetch(`/api/prompts/${id}`);
    const pData = await pRes.json();
    setPrompt(pData);
    if(pData.variables) setVariables(pData.variables);
    if(pData.todos) setTodos(pData.todos);

    const cRes = await fetch(`/api/prompts/${id}/chunks`);
    const cData = await cRes.json();
    setChunks(cData);
    if (cData.length > 0 && !activeChunk) {
      setActiveChunk(cData[0]);
    }

    const vRes = await fetch(`/api/prompts/${id}/versions`);
    const vData = await vRes.json();
    setVersions(vData);

    const sRes = await fetch('/api/settings');
    const sData = await sRes.json();
    if(sData && sData.globalVariables) setGlobalVariables(sData.globalVariables);
    
    const dRes = await fetch('/api/domains');
    const dData = await dRes.json();
    if(Array.isArray(dData)) setDomains(dData);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(chunks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setChunks(items);
    
    const chunkIds = items.map(c => c._id);
    await fetch(`/api/prompts/${id}/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chunkIds })
    });
  };

  const handleUpdateChunk = async (updatedContent: string, updatedTitle: string = activeChunk?.title || '', locked: boolean = activeChunk?.locked || false, enabled: boolean = activeChunk?.enabled !== false, role: string = activeChunk?.role || 'system') => {
    if (!activeChunk) return;
    const res = await fetch(`/api/chunks/${activeChunk._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: updatedContent, title: updatedTitle, locked, enabled, role })
    });
    const updated = await res.json();
    setChunks(chunks.map(c => c._id === updated._id ? updated : c));
    setActiveChunk(updated);
  };

  const handleUpdateVariables = async (newVars: Record<string, string>) => {
    setVariables(newVars);
    await fetch(`/api/prompts/${id}`, {
       method: 'PUT',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({ variables: newVars })
    });
  };

  const filteredChunks = useMemo(() => {
    if (!searchQuery.trim()) return chunks;
    const lowerQ = searchQuery.toLowerCase();
    return chunks.filter(c => c.title.toLowerCase().includes(lowerQ) || c.content.toLowerCase().includes(lowerQ));
  }, [chunks, searchQuery]);

  const handleExport = () => {
    if (!prompt) return;
    let joiner = '\n\n';
    if (prompt.chunkingLogic) {
        try {
            const parsed = JSON.parse(prompt.chunkingLogic);
            if (parsed.splitMethod === 'kalpline') joiner = '\n\n### -----\n\n';
        } catch(e) {}
    } else {
        joiner = '\n\n### -----\n\n';
    }

    let finalPrompt = chunks.filter(c => c.enabled !== false).map(c => c.content).join(joiner);
    
    const blob = new Blob([finalPrompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.title.replace(/\s+/g, '_')}_v${prompt.version}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateChunk = async () => {
    const res = await fetch('/api/chunks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        promptId: id, 
        title: 'New Branch', 
        content: '', 
        role: 'user' 
      })
    });
    const newChunk = await res.json();
    setChunks([...chunks, newChunk]);
    setActiveChunk(newChunk);
  };

  const handleDeleteChunk = async () => {
    if (!activeChunk) return;
    const proceed = await confirm('Delete Branch', 'Are you sure you want to delete this branch?');
    if (!proceed) return;
    
    await fetch(`/api/chunks/${activeChunk._id}`, { method: 'DELETE' });
    const updatedChunks = chunks.filter(c => c._id !== activeChunk._id);
    setChunks(updatedChunks);
    setActiveChunk(updatedChunks.length > 0 ? updatedChunks[0] : null);
  };

  const handleCreateVersion = async () => {
      try {
         const res = await fetch(`/api/prompts/${id}/versions`, { method: 'POST' });
         const data = await res.json();
         if(data.version) {
             setVersions([data.version, ...versions]);
             setPrompt(data.prompt);
         }
      } catch (err) {
         console.error(err);
      }
  };

  const handleSwitchVersion = async (versionId: string) => {
      const proceed = await confirm('Switch Version', 'Switching version will overwrite your current branches. Continue?');
      if(!proceed) return;
      try {
          const res = await fetch(`/api/prompts/${id}/switch-version/${versionId}`, { method: 'POST' });
          const data = await res.json();
          if(data.success) {
              fetchData();
          }
      } catch (err) {
          console.error(err);
      }
  };

  const handleDeleteVersion = async (versionId: string) => {
      const proceed = await confirm('Delete Version', 'Are you sure you want to delete this version completely?');
      if(!proceed) return;
      try {
          await fetch(`/api/prompts/${id}/versions/${versionId}`, { method: 'DELETE' });
          setVersions(versions.filter(v => v._id !== versionId));
      } catch (err) {
          console.error(err);
      }
  };

  if (!prompt) return <div className="p-12 text-center text-primary font-semibold">Gathering roots...</div>;

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <header className="bg-white/95 backdrop-blur-md border-b border-primary/10 px-4 md:px-8 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-4 w-full xl:w-auto">
          <Link href="/" className="w-10 h-10 shrink-0 bg-gray-100 hover:bg-primary/20 rounded-full flex items-center justify-center text-gray-600 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-gray-800 truncate">{prompt.title}</h2>
            <div className="flex items-center gap-2 mt-1 text-xs md:text-sm font-semibold text-primary">
              <span className="bg-primary/10 px-2 py-0.5 rounded-md">Version {prompt.version}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{chunks.length} Branches</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 xl:pb-0 w-full xl:w-auto custom-scroll shrink-0">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl mr-2">
             <button onClick={() => setViewMode('branches')} className={`px-4 py-1.5 text-sm rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === 'branches' ? 'bg-white text-primary-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Layers className="w-4 h-4" /> Branches
             </button>
             <button onClick={() => setViewMode('document')} className={`px-4 py-1.5 text-sm rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === 'document' ? 'bg-white text-primary-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <LayoutTemplate className="w-4 h-4" /> Document
             </button>
          </div>

          <button onClick={() => setShowVersions(!showVersions)} className={`px-4 py-2.5 text-sm whitespace-nowrap shrink-0 ${showVersions ? 'bg-primary text-white font-bold border-primary' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-200 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all focus:outline-none min-w-[130px]`}>
             <GitBranch className="w-4 h-4" /> <span>Versions</span> ({versions.length})
          </button>
          <button onClick={() => setShowNotes(!showNotes)} className={`px-4 py-2.5 text-sm whitespace-nowrap shrink-0 ${showNotes ? 'bg-primary text-white font-bold border-primary' : 'bg-white text-gray-700 hover:bg-gray-50'} border border-gray-200 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all focus:outline-none min-w-[130px]`}>
             <Notebook className="w-4 h-4" /> <span>Notes</span>
          </button>
          <button onClick={handleExport} className="whitespace-nowrap shrink-0 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2.5 text-sm rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-transform active:scale-95 min-w-[130px]">
            Export MD
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative">
        {/* Sidebar for chunks */}
        {sidebarOpen && viewMode === 'branches' && (
        <div 
          ref={sidebarRef}
          style={{ width: window.innerWidth >= 768 ? sidebarWidth : '100%' }}
          className="bg-surface border-b md:border-b-0 md:border-r border-primary/10 flex flex-col h-1/3 min-h-[300px] md:h-full overflow-hidden shrink-0 relative"
        >
          <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-gray-700">Prompt Branches</h3>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors md:hidden lg:block" title="Collapse Sidebar">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button onClick={handleCreateChunk} className="text-primary hover:text-primary-dark p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
            </div>
            <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search branches..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scroll">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="chunks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {filteredChunks.map((chunk, index) => (
                      <Draggable key={chunk._id} draggableId={chunk._id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            onClick={() => setActiveChunk(chunk)}
                            className={`group flex flex-col bg-white border ${activeChunk?._id === chunk._id ? 'border-primary shadow-md shadow-primary/10' : 'border-gray-200'} rounded-2xl p-3 cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden ${chunk.enabled === false ? 'opacity-50 grayscale' : ''}`}
                          >
                            {activeChunk?._id === chunk._id && (
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                            )}
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing p-1 -ml-1">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Branch {index + 1}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); setActiveCommentChunkId(chunk._id); setShowNotes(true); }} className="text-gray-300 hover:text-primary transition-colors p-1" title="Add note for this branch"><MessageSquare className="w-3.5 h-3.5" /></button>
                                {chunk.locked && <Lock className="w-3 h-3 text-red-400" />}
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{chunk.role}</span>
                              </div>
                            </div>
                            <h4 className="font-semibold text-gray-800 text-sm pl-7 line-clamp-1">{chunk.title}</h4>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          
          <div 
             className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/50 active:bg-primary z-10 transition-colors"
             onMouseDown={handleMouseDown}
          />
        </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col h-full bg-white/50 relative overflow-hidden min-h-0">
          {!sidebarOpen && (
             <button onClick={() => setSidebarOpen(true)} className="absolute left-4 top-4 z-20 text-gray-500 hover:text-gray-800 bg-white shadow-sm border border-gray-200 p-2 rounded-lg" title="Open Sidebar">
               <ArrowLeft className="w-4 h-4 rotate-180" />
             </button>
          )}
          {viewMode === 'document' ? (
              <div className="flex-1 flex flex-col min-h-0 bg-white/50 relative">
                  <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between z-10 shadow-sm">
                      <div className="flex items-center gap-2">
                          <h3 className="font-heading font-bold text-gray-800">Document Editor</h3>
                          <span className="text-xs text-gray-500 font-semibold bg-gray-100 px-2 py-1 rounded-md">Markdown</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <button onClick={async () => {
                              const proceed = await confirm("Overwrite Branches", "This will overwrite all current branches with the text below. Continue?");
                              if(!proceed) return;
                              
                              let sections: string[] = [];
                              let splitMethod = 'kalpline';
                              let customRegex = '';
                              if (prompt?.chunkingLogic) {
                                  try {
                                      const parsed = JSON.parse(prompt.chunkingLogic);
                                      if (parsed.splitMethod) splitMethod = parsed.splitMethod;
                                      if (parsed.customRegex) customRegex = parsed.customRegex;
                                  } catch(e) {}
                              }
                              
                              if (splitMethod === 'kalpline') {
                                  sections = documentText.split(/\n?### -----\n?/).filter((s: string) => s.trim().length > 0);
                              } else if (splitMethod === 'headers') {
                                  sections = documentText.split(/(?=\n#{1,6}\s)/g).filter((s: string) => s.trim().length > 0);
                              } else if (splitMethod === 'paragraphs') {
                                  sections = documentText.split(/\n\s*\n/).filter((s: string) => s.trim().length > 0);
                              } else if (splitMethod === 'custom' && customRegex) {
                                  try {
                                      const regex = new RegExp(customRegex, 'g');
                                      sections = documentText.split(regex).filter((s: string) => s.trim().length > 0);
                                  } catch (e) {
                                      sections = [documentText];
                                  }
                              } else {
                                  sections = [documentText];
                              }
                              
                              for (const c of chunks) {
                                  await fetch(`/api/chunks/${c._id}`, { method: 'DELETE' });
                              }
                              
                              for (let i = 0; i < sections.length; i++) {
                                  const s = sections[i];
                                  let title = `Branch ${i + 1}`;
                                  if (splitMethod === 'headers') {
                                      const match = s.match(/^#{1,6}\s+(.*)/);
                                      if (match) title = match[1].trim();
                                  } else {
                                      const firstLine = s.trim().split('\n')[0];
                                      if (firstLine.length < 50 && firstLine.length > 0) {
                                         title = firstLine.replace(/^#+\s+/, '');
                                      }
                                  }
                                  await fetch('/api/chunks', {
                                     method: 'POST',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ promptId: id, title: title || `Branch ${i+1}`, content: s.trim(), role: 'user', order: i })
                                  });
                              }
                              
                              await fetchData();
                              setViewMode('branches');
                          }} className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg shadow-md hover:bg-primary-dark transition-colors flex items-center gap-2">
                             <Save className="w-4 h-4" /> Save & Sync to Branches
                          </button>
                      </div>
                  </div>
                  <div className="flex-1 flex flex-col md:flex-row gap-0 min-h-0">
                      <div className="w-48 bg-gray-50 border-r border-gray-200 overflow-y-auto custom-scroll hidden lg:block">
                         <div className="p-4 border-b border-gray-200 bg-gray-100 sticky top-0 z-10">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Document Outline</h4>
                         </div>
                         <ul className="p-2 space-y-1">
                            {documentHints.map((hint, idx) => (
                                  <li key={idx}>
                                     <button 
                                        className="text-left text-xs text-gray-600 font-semibold hover:text-primary hover:bg-primary/5 w-full py-2 px-3 rounded-md transition-colors flex items-center gap-2 min-w-0"
                                        onClick={() => {
                                            if (docEditorRef.current) {
                                                const percentage = hint.startIndex / Math.max(1, documentText.length);
                                                docEditorRef.current.scrollTop = percentage * Math.max(1, docEditorRef.current.scrollHeight);
                                                handleSyncScroll({ target: docEditorRef.current } as any);
                                            }
                                        }}
                                        title={hint.title}
                                     >
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                                        <span className="truncate flex-1 min-w-0 text-gray-700 font-medium">{hint.title || 'Untitled Branch'}</span>
                                     </button>
                                  </li>
                            ))}
                            {documentHints.length === 0 && (
                                <li className="text-xs text-gray-400 p-2 italic">No branches available.</li>
                            )}
                         </ul>
                      </div>
                      <div className="flex-1 border-r border-gray-200 bg-white relative">
                          <textarea
                             ref={docEditorRef}
                             onScroll={handleSyncScroll}
                             value={documentText}
                             onChange={handleDocumentTextChange}
                             className="absolute inset-0 w-full h-full p-6 outline-none resize-none font-mono text-sm leading-relaxed text-gray-700 custom-scroll"
                             placeholder="Type your whole prompt here..."
                          />
                      </div>
                      <div className="flex-1 bg-white relative hidden md:block">
                          <div
                             ref={docPreviewRef}
                             onScroll={handleSyncScroll}
                             className="absolute inset-0 w-full h-full p-8 overflow-y-auto custom-scroll prose prose-sm max-w-none prose-headings:font-heading prose-a:text-primary prose-code:text-primary-dark"
                          >
                             <Markdown remarkPlugins={[remarkGfm]}>{documentText}</Markdown>
                          </div>
                      </div>
                  </div>
              </div>
           ) : compareVersion ? (
             <div className={`flex flex-col min-h-0 ${compareFullscreen ? 'fixed inset-0 bg-background z-[60] p-6 md:p-8' : 'flex-1 p-8 pb-32 h-full bg-white/50 z-20'}`}>
               <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xl font-heading font-bold text-gray-800">Comparing Versions</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCompareFullscreen(!compareFullscreen)} className="px-4 py-2 bg-white text-gray-600 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 font-bold text-sm">
                        {compareFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    </button>
                    <button onClick={() => { setCompareVersion(null); setCompareFullscreen(false); }} className="px-4 py-2 bg-white text-gray-600 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 font-bold text-sm">
                        Exit Compare Mode
                    </button>
                  </div>
               </div>
               <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 h-full">
                   {(() => {
                       const oldText = (() => {
                           try {
                               const parsed = JSON.parse(compareVersion.contentSnapshot);
                               return parsed.map((c: any) => c.content).join('\n\n');
                           } catch(e) {
                               return compareVersion.contentSnapshot;
                           }
                       })();
                       const newText = chunks.filter(c => c.enabled !== false).map(c => c.content).join('\n\n');
                       const diff = diffLines(oldText, newText);

                       return (
                           <>
                               <div className="flex-1 flex flex-col rounded-[2rem] border border-gray-200 overflow-hidden bg-white shadow-sm">
                                   <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 font-bold text-sm text-gray-600">
                                       Version {compareVersion.versionNumber}
                                   </div>
                                   <div 
                                       ref={compareOldRef}
                                       onScroll={handleSyncScroll}
                                       className="flex-1 p-6 overflow-y-auto custom-scroll font-mono text-sm leading-relaxed whitespace-pre"
                                   >
                                       {diff.map((line, idx) => {
                                           if (line.type === 'added') {
                                               return <div key={idx} className="bg-gray-50/30 text-transparent select-none px-2 leading-relaxed">&nbsp;</div>;
                                           }
                                           const isRemoved = line.type === 'removed';
                                           return (
                                               <div key={idx} className={`min-h-6 px-2 ${isRemoved ? 'bg-red-50 text-red-700 font-semibold border-l-2 border-red-500' : 'text-gray-500'}`}>
                                                   {line.value || ' '}
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                               <div className="flex-1 flex flex-col rounded-[2rem] border border-primary/20 overflow-hidden bg-white shadow-xl shadow-primary/5">
                                   <div className="bg-primary/5 border-b border-primary/10 px-6 py-3 font-bold text-sm text-primary-dark">
                                       Current Output
                                   </div>
                                   <div 
                                       ref={compareNewRef}
                                       onScroll={handleSyncScroll}
                                       className="flex-1 p-6 overflow-y-auto custom-scroll font-mono text-sm leading-relaxed whitespace-pre"
                                   >
                                       {diff.map((line, idx) => {
                                           if (line.type === 'removed') {
                                               return <div key={idx} className="bg-gray-50/30 text-transparent select-none px-2 leading-relaxed">&nbsp;</div>;
                                           }
                                           const isAdded = line.type === 'added';
                                           return (
                                               <div key={idx} className={`min-h-6 px-2 ${isAdded ? 'bg-green-50 text-green-700 font-semibold border-l-2 border-green-500' : 'text-gray-700'}`}>
                                                   {line.value || ' '}
                                               </div>
                                           );
                                       })}
                                   </div>
                               </div>
                           </>
                       );
                   })()}
                </div>
            </div>
          ) : activeChunk ? (
            <div className="flex-1 flex flex-col p-8 pb-32 min-h-0">
               <div className="mb-4 flex items-center justify-between">
                  <input 
                    type="text"
                    value={activeChunk.title}
                    onChange={(e) => setActiveChunk({ ...activeChunk, title: e.target.value })}
                    onBlur={() => handleUpdateChunk(activeChunk.content, activeChunk.title)}
                    className="text-3xl font-heading font-bold text-gray-800 bg-transparent border-b border-transparent hover:border-primary/30 focus:border-primary outline-none transition-colors px-2 -ml-2 w-2/3"
                    disabled={activeChunk.locked}
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setActiveCommentChunkId(activeChunk._id); setShowNotes(true); }} title="Add comment for this branch" className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors bg-white rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                    </button>
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                       <button onClick={() => handleUpdateChunk(activeChunk.content, activeChunk.title, activeChunk.locked, activeChunk.enabled, 'system')} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeChunk.role === 'system' ? 'bg-primary/20 text-primary-dark' : 'text-gray-400 hover:bg-gray-50'}`}>
                           System
                       </button>
                       <button onClick={() => handleUpdateChunk(activeChunk.content, activeChunk.title, activeChunk.locked, activeChunk.enabled, 'user')} className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors border-l border-gray-200 ${activeChunk.role === 'user' ? 'bg-primary/20 text-primary-dark' : 'text-gray-400 hover:bg-gray-50'}`}>
                           User
                       </button>
                    </div>
                    <button onClick={() => handleUpdateChunk(activeChunk.content, activeChunk.title, activeChunk.locked, !(activeChunk.enabled !== false), activeChunk.role)} title={activeChunk.enabled !== false ? "Disable Branch" : "Enable Branch"} className={`p-2 font-semibold text-[10px] min-w-[70px] uppercase tracking-widest flex items-center justify-center transition-colors bg-white rounded-lg border border-gray-200 ${activeChunk.enabled !== false ? 'text-primary border-primary/50' : 'text-gray-400 opacity-50'}`}>
                       {activeChunk.enabled !== false ? 'Active' : 'Muted'}
                    </button>
                    <button onClick={() => handleUpdateChunk(activeChunk.content, activeChunk.title, !activeChunk.locked, activeChunk.enabled, activeChunk.role)} className={`p-2 transition-colors bg-white rounded-lg border border-gray-200 ${activeChunk.locked ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-gray-400 hover:text-gray-600'}`}>
                      {activeChunk.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>
                    <button onClick={handleDeleteChunk} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-lg border border-gray-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>
               <div className={`flex-1 min-h-0 rounded-[2rem] border overflow-hidden flex flex-col relative transition-colors ${activeChunk.locked ? 'bg-gray-50 border-gray-300' : 'bg-white border-primary/20 shadow-xl shadow-primary/5'}`}>
                  <div className={`bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between ${activeChunk.locked ? 'opacity-70' : ''}`}>
                     <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Editor</span>
                     {activeChunk.locked ? <Lock className="w-4 h-4 text-red-400" /> : <Edit3 className="w-4 h-4 text-gray-400" />}
                  </div>
                  {activeChunk.locked && <div className="absolute inset-x-0 bottom-0 top-[45px] opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>}
                  <textarea
                    value={activeChunk.content}
                    onChange={(e) => setActiveChunk({ ...activeChunk, content: e.target.value })}
                    onBlur={() => handleUpdateChunk(activeChunk.content)}
                    className={`flex-1 w-full bg-transparent p-6 outline-none resize-none font-mono text-sm leading-relaxed custom-scroll relative z-10 ${activeChunk.locked ? 'text-gray-500' : 'text-gray-700'}`}
                    disabled={activeChunk.locked}
                  />
               </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 font-semibold">
              Select a branch to edit
            </div>
          )}



          {/* Versions Sidebar */}
          <AnimatePresence>
               {showVersions && (
                  <motion.div 
                      className="absolute right-0 top-0 bottom-0 w-full md:w-80 md:max-w-sm bg-white border-l border-primary/10 flex flex-col z-30 shadow-xl"
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  >
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary/5">
                          <h3 className="font-heading font-bold text-primary-dark flex items-center gap-2">
                              <GitBranch className="w-5 h-5" /> All Versions
                          </h3>
                          <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-gray-800 text-sm">Close</button>
                      </div>
                      <div className="p-4 border-b border-gray-100 flex justify-center bg-gray-50/50">
                          <button onClick={handleCreateVersion} className="w-full bg-primary text-white hover:bg-primary-dark transition-colors rounded-xl py-2 px-4 shadow-md font-bold flex items-center justify-center gap-2">
                             <Save className="w-4 h-4" /> Save Current as New Version
                          </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
                         {versions.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center mt-4">No saved versions found.</p>
                          ) : (
                              versions.map((v) => (
                                  <div key={v._id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${prompt.version === v.versionNumber ? 'border-primary ring-1 ring-primary/20' : 'border-gray-200 hover:border-gray-300'}`}>
                                     <div className={`px-4 py-2 border-b flex items-center justify-between ${prompt.version === v.versionNumber ? 'bg-primary/10 border-primary/20' : 'bg-gray-50 border-gray-100'}`}>
                                         <span className={`font-bold font-heading ${prompt.version === v.versionNumber ? 'text-primary-dark' : 'text-gray-700'}`}>
                                             Version {v.versionNumber}
                                         </span>
                                         {prompt.version === v.versionNumber && (
                                             <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-white px-2 py-0.5 rounded-full shadow-sm">Current</span>
                                         )}
                                     </div>
                                     <div className="p-4 flex flex-col gap-3">
                                         <div className="text-xs text-gray-500 font-mono">
                                             Saved: {new Date(v.createdAt).toLocaleString()}
                                         </div>
                                         <div className="flex items-center gap-2 justify-end mt-2">
                                             <button onClick={() => handleDeleteVersion(v._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete Version">
                                                 <Trash2 className="w-4 h-4" />
                                             </button>
                                             {prompt.version !== v.versionNumber && (
                                                 <div className="flex gap-2">
                                                     <button onClick={() => setCompareVersion(v)} className="px-3 py-1.5 text-xs font-bold bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200">
                                                         Compare
                                                     </button>
                                                     <button onClick={() => handleSwitchVersion(v._id)} className="px-3 py-1.5 text-xs font-bold bg-primary/10 text-primary-dark hover:bg-primary/20 rounded-lg transition-colors border border-primary/20">
                                                         Restore
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     </div>
                                  </div>
                              ))
                          )}
                      </div>
                  </motion.div>
               )}
          </AnimatePresence>

          {/* Notes/Todos Sidebar */}
          <AnimatePresence>
               {showNotes && (
                  <motion.div 
                      className="absolute right-0 top-0 bottom-0 w-full md:w-80 md:max-w-sm bg-white border-l border-primary/10 flex flex-col z-30 shadow-xl"
                      initial={{ x: "100%" }}
                      animate={{ x: 0 }}
                      exit={{ x: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  >
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-primary/5">
                          <h3 className="font-heading font-bold text-primary-dark flex items-center gap-2">
                              {activeCommentChunkId ? <MessageSquare className="w-5 h-5" /> : <Notebook className="w-5 h-5" />}
                              {activeCommentChunkId ? 'Comments / Notes' : 'To-Dos / Notes'}
                          </h3>
                          <button onClick={() => { setShowNotes(false); setActiveCommentChunkId(null); }} className="text-gray-400 hover:text-gray-800 text-sm">Close</button>
                      </div>
                      <div className="flex-1 flex flex-col bg-gray-50 overflow-y-auto custom-scroll p-4 space-y-2">
                          {todos.map(todo => {
                              const associatedChunk = chunks.find(c => c._id === todo.chunkId);
                              return (
                              <div key={todo.id} className={`flex items-start gap-3 p-3 bg-white border rounded-xl shadow-sm transition-all ${todo.done ? 'border-green-200 bg-green-50/30 opacity-70' : 'border-gray-200'}`}>
                                  <input 
                                     type="checkbox" 
                                     checked={todo.done}
                                     onChange={() => {
                                         const newTodos = todos.map(t => t.id === todo.id ? { ...t, done: !t.done } : t);
                                         setTodos(newTodos);
                                     }}
                                     className="mt-1 w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                                  />
                                  <div className={`flex-1 text-sm ${todo.done ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                      {todo.text}
                                      {associatedChunk && (
                                          <div className="text-[10px] text-primary mt-1 font-semibold flex items-center gap-1">
                                              <GitBranch className="w-3 h-3" /> {associatedChunk.title}
                                          </div>
                                      )}
                                  </div>
                                  <button onClick={async () => {
                                      const proceed = await confirm('Delete Note', 'Are you sure you want to delete this note?');
                                      if(proceed) setTodos(todos.filter(t => t.id !== todo.id));
                                  }} className="text-gray-400 hover:text-red-500">
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          )})}
                      </div>
                      <div className="p-4 border-t border-gray-100 bg-white flex flex-col gap-2 relative">
                         {activeCommentChunkId && (
                              <div className="text-xs font-bold text-gray-500 mb-1 flex items-center justify-between">
                                  <span>Posting on: {chunks.find(c => c._id === activeCommentChunkId)?.title}</span>
                                  <button onClick={() => setActiveCommentChunkId(null)} className="text-red-400 hover:underline">Clear</button>
                              </div>
                          )}
                         <div className="flex items-center gap-2">
                             <input 
                                 type="text" 
                                 value={newTodoText}
                                 onChange={e => setNewTodoText(e.target.value)}
                                 onKeyDown={e => {
                                     if(e.key === 'Enter' && newTodoText.trim()) {
                                         setTodos([...todos, { id: Date.now().toString(), text: newTodoText.trim(), done: false, chunkId: activeCommentChunkId || undefined }]);
                                         setNewTodoText('');
                                     }
                                 }}
                                 placeholder={activeCommentChunkId ? "Add a comment..." : "Add a to-do/note..."}
                                 className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                             />
                             <button onClick={() => {
                                 if(newTodoText.trim()) {
                                     setTodos([...todos, { id: Date.now().toString(), text: newTodoText.trim(), done: false, chunkId: activeCommentChunkId || undefined }]);
                                     setNewTodoText('');
                                 }
                             }} className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
                                 <Plus className="w-4 h-4" />
                             </button>
                         </div>
                         <button onClick={async () => {
                             try {
                                 await fetch(`/api/prompts/${id}`, {
                                     method: 'PUT',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ todos })
                                 });
                             } catch(err) {
                                 console.error(err);
                             }
                         }} className="w-full mt-2 bg-primary/10 text-primary-dark hover:bg-primary/20 transition-colors rounded-xl py-2 px-4 font-bold flex items-center justify-center gap-2">
                             <Save className="w-4 h-4" /> Save Notes
                         </button>
                      </div>
                  </motion.div>
               )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
