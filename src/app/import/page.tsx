"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../../AppContext';
import { useRouter } from 'next/navigation';
import { UploadCloud, Sprout, Globe, Copy } from 'lucide-react';


const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
};

export default function ImportPage() {
  const { importPrompt, seedTemplate, clonePrompt, deletePrompt } = useAppContext();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [rawText, setRawText] = useState('');
  const [splitMethod, setSplitMethod] = useState('mixed');
  const [customRegex, setCustomRegex] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [globalPrompts, setGlobalPrompts] = useState<any[]>([]);

  useEffect(() => {
     fetchGlobalPrompts();
  }, []);

  const fetchGlobalPrompts = () => {
     fetch('/api/prompts')
       .then(res => res.json())
       .then(data => {
            if(Array.isArray(data)) {
                setGlobalPrompts(data.filter(p => !p.domainId));
            }
       })
       .catch(err => console.error(err));
  };

  useEffect(() => {
      // Auto-parse chunkingLogic frontmatter
      const match = rawText.match(/^---\nchunkingLogic:\s*({.*})\n---\n\n([\s\S]*)$/);
      if (match) {
          try {
              const parsedLogic = JSON.parse(match[1]);
              if (parsedLogic.splitMethod) setSplitMethod(parsedLogic.splitMethod);
              if (parsedLogic.customRegex) setCustomRegex(parsedLogic.customRegex);
              setRawText(match[2]);
          } catch(e) {
              console.error("Failed to parse chunking logic", e);
          }
      }
  }, [rawText]);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setIsImporting(true);
    try {
      const data = await importPrompt(title || "Untitled Prompt", rawText, splitMethod, customRegex);
      router.push(`/prompt/${data.prompt._id}`);
    } catch (err) {
      console.error(err);
      setIsImporting(false);
    }
  };

  const handleSeedEcommerce = async () => {
    setIsImporting(true);
    try {
      const data = await seedTemplate('ecommerce');
      router.push(`/prompt/${data.prompt._id}`);
    } catch(err) {
      console.error(err);
      setIsImporting(false);
    }
  }

  const handleClone = async (id: string) => {
      setIsImporting(true);
      try {
          const cloned = await clonePrompt(id);
          router.push(`/prompt/${cloned._id}`);
      } catch (err) {
          console.error(err);
          setIsImporting(false);
      }
  };

  return (
    <motion.div 
      className="p-8 max-w-4xl mx-auto min-h-screen flex flex-col gap-12"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div>
          <header className="mb-6 md:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-dark mb-2">Plant a New Prompt</h2>
              <p className="text-gray-600">Paste your massive monolithic prompt below. The system will automatically parse markdown headings and double line breaks into modular chunks.</p>
            </div>
          </header>

          <form onSubmit={handleImport} className="flex flex-col gap-6">
            <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-8 shadow-xl shadow-primary/5 border border-primary/10 flex flex-col">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Species Name (Title)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-heading"
                  placeholder="e.g. Master E-Commerce Builder"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monolithic Prompt Content</label>
                <textarea 
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm resize-none min-h-[200px]"
                  placeholder="Paste the massive prompt here..."
                  required
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-4 items-end">
                 <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Branching Logic (Chunking)</label>
                    <select 
                        value={splitMethod}
                        onChange={e => setSplitMethod(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm font-semibold"
                    >
                        <option value="kalpline">KalpLine (### -----)</option>
                        <option value="mixed">Smart Mixed (Headers + Double Newline)</option>
                        <option value="headers">Markdown Headers Only (#)</option>
                        <option value="paragraphs">Paragraphs (Double Newline)</option>
                        <option value="custom">Custom Regex</option>
                    </select>
                 </div>
                 {splitMethod === 'custom' && (
                     <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Custom Regex Delimiter</label>
                        <input 
                            type="text" 
                            value={customRegex}
                            onChange={e => setCustomRegex(e.target.value)}
                            placeholder="e.g. (?=\n##\s)"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm"
                        />
                     </div>
                 )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={isImporting || !rawText.trim()}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-primary/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isImporting ? (
                  <>
                    <Sprout className="w-6 h-6 animate-spin" />
                    Planting...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-6 h-6" />
                    Root and Branch
                  </>
                )}
              </button>
            </div>
          </form>
      </div>

      <div className="bg-white/50 backdrop-blur-md rounded-[2rem] p-8 border border-primary/10">
          <div className="flex items-center justify-between mb-6">
              <div>
                  <h3 className="text-2xl font-heading font-bold text-gray-800 flex items-center gap-2">
                     <Globe className="w-6 h-6 text-primary" />
                     Global Templates
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">Import pre-built global templates directly into your active project.</p>
              </div>
              <button onClick={handleSeedEcommerce} disabled={isImporting} className="bg-white border-2 border-accent text-accent-dark hover:bg-accent/10 px-4 py-2 rounded-full font-bold shadow-sm transition-all focus:outline-none text-sm">
                  Seed E-Commerce Defaults
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {globalPrompts.map(prompt => (
                  <div key={prompt._id} className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow relative group">
                      <div className="pr-8">
                          <h4 className="font-bold text-gray-800">{prompt.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{prompt.description}</p>
                      </div>
                      <button 
                         onClick={async () => {
                             if (confirm('Are you sure you want to delete this global prompt?')) {
                                await deletePrompt(prompt._id);
                                fetchGlobalPrompts();
                             }
                         }}
                         className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                         title="Delete Global Prompt"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                      <button 
                          onClick={() => handleClone(prompt._id)}
                          disabled={isImporting}
                          className="mt-4 flex items-center justify-center gap-2 w-full bg-gray-50 hover:bg-primary/10 text-primary-dark border border-gray-200 hover:border-primary/30 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      >
                          <Copy className="w-4 h-4" /> Import to Project
                      </button>
                  </div>
              ))}
              {globalPrompts.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                     No global prompts available.
                  </div>
              )}
          </div>
      </div>
    </motion.div>
  );
}
