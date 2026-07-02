"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

type Prompt = {
  _id: string;
  title: string;
  description: string;
  version: number;
  updatedAt: string;
};

type Chunk = {
  _id: string;
  promptId: string;
  title: string;
  content: string;
  order: number;
  role: string;
};

type Domain = {
  _id: string;
  name: string;
  variables: Record<string, string>;
};

interface AppContextType {
  prompts: Prompt[];
  domains: Domain[];
  activeDomainId: string | null;
  setActiveDomainId: (id: string | null) => void;
  fetchPrompts: () => Promise<void>;
  createPrompt: (data: Partial<Prompt>) => Promise<Prompt>;
  deletePrompt: (id: string) => Promise<void>;
  clonePrompt: (id: string) => Promise<Prompt>;
  importPrompt: (title: string, rawText: string, splitMethod: string, customRegex?: string) => Promise<any>;
  seedTemplate: (type: string) => Promise<any>;
  deleteDomain: (id: string) => Promise<void>;
  confirm: (title: string, message: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState<{
    resolve: (val: boolean) => void;
    title: string;
    message: string;
  } | null>(null);

  const confirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ resolve, title, message });
    });
  };

  // Safely initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('activeDomainId');
      if (stored) setActiveDomainId(stored);
    }
  }, []);

  const fetchDomains = async () => {
      try {
          const res = await fetch('/api/domains');
          const data = await res.json();
          if (Array.isArray(data)) setDomains(data);
      } catch (err) {
          console.error(err);
      }
  };

  const fetchPrompts = async () => {
    try {
      let url = '/api/prompts';
      if (activeDomainId) {
          url += `?domainId=${activeDomainId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setPrompts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const createPrompt = async (data: Partial<Prompt>) => {
    const payload = { ...data, domainId: activeDomainId };
    const res = await fetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const newPrompt = await res.json();
    setPrompts([newPrompt, ...prompts]);
    return newPrompt;
  };

  const deletePrompt = async (id: string) => {
    await fetch(`/api/prompts/${id}`, { method: 'DELETE' });
    setPrompts(prompts.filter(p => p._id !== id));
  };

  const deleteDomain = async (id: string) => {
    const proceed = await confirm('Delete Project', 'Are you sure you want to delete this project? This will delete all its prompts.');
    if (!proceed) return;
    try {
      const res = await fetch(`/api/domains/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDomains(prev => prev.filter(d => d._id !== id));
        if (activeDomainId === id) {
          setActiveDomainId(null);
        } else {
          fetchPrompts();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clonePrompt = async (id: string) => {
    const res = await fetch(`/api/prompts/${id}/clone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domainId: activeDomainId })
    });
    const cloned = await res.json();
    fetchPrompts();
    return cloned;
  };

  const importPrompt = async (title: string, rawText: string, splitMethod: string, customRegex?: string) => {
    const res = await fetch('/api/prompts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, rawText, splitMethod, customRegex, domainId: activeDomainId })
    });
    const data = await res.json();
    fetchPrompts();
    return data;
  };

  const seedTemplate = async (type: string) => {
    const res = await fetch('/api/prompts/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, domainId: activeDomainId })
    });
    const data = await res.json();
    fetchPrompts();
    return data;
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    fetchPrompts();
    if (typeof window !== 'undefined') {
      if (activeDomainId) {
          localStorage.setItem('activeDomainId', activeDomainId);
      } else {
          localStorage.removeItem('activeDomainId');
      }
    }
  }, [activeDomainId]);

  return (
    <AppContext.Provider value={{ prompts, domains, activeDomainId, setActiveDomainId, fetchPrompts, createPrompt, deletePrompt, clonePrompt, importPrompt, seedTemplate, deleteDomain, confirm }}>
      {children}
      <AnimatePresence>
        {confirmState && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                confirmState.resolve(false);
                setConfirmState(null);
              }}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden p-6 md:p-8 flex flex-col gap-5 z-10"
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-heading font-bold text-gray-800 leading-tight">
                  {confirmState.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-sans">
                  {confirmState.message}
                </p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    confirmState.resolve(false);
                    setConfirmState(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmState.resolve(true);
                    setConfirmState(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 active:scale-95 shadow-md shadow-red-100 transition-all font-sans"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
