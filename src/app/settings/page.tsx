"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../../AppContext';
import { Save, Key, Plus, Trash2, Globe } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
};

type GlobalVariables = Record<string, string>;
type Domain = {
  _id: string;
  name: string;
  variables: Record<string, string>;
};

export default function SettingsPage() {
  const { confirm } = useAppContext();
  const [settings, setSettings] = useState({
    geminiKey: '',
    openAiKey: '',
    defaultModel: 'gemini-2.5-flash'
  });
  const [globalVariables, setGlobalVariables] = useState<GlobalVariables>({});
  const [domains, setDomains] = useState<Domain[]>([]);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [newVarKey, setNewVarKey] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [newDomainName, setNewDomainName] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if(data) {
            setSettings({
                geminiKey: data.geminiKey || '',
                openAiKey: data.openAiKey || '',
                defaultModel: data.defaultModel || 'gemini-2.5-flash'
            });
            setGlobalVariables(data.globalVariables || {});
        }
      });
      
    fetch('/api/domains')
      .then(res => res.json())
      .then(data => {
          if(data && Array.isArray(data)) {
              setDomains(data);
          }
      });
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...settings, globalVariables })
      });
      if(res.ok) {
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3001);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateDomain = async () => {
      if(!newDomainName.trim()) return;
      try {
          const res = await fetch('/api/domains', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: newDomainName.trim(), variables: {} })
          });
          const data = await res.json();
          setDomains([data, ...domains]);
          setNewDomainName('');
          setActiveDomainId(data._id);
      } catch (err) {
          console.error(err);
      }
  };

  const handleDeleteDomain = async (id: string) => {
      const proceed = await confirm('Delete Domain', 'Are you sure you want to delete this domain?');
      if(!proceed) return;
      try {
          await fetch(`/api/domains/${id}`, { method: 'DELETE' });
          setDomains(domains.filter(d => d._id !== id));
          if(activeDomainId === id) setActiveDomainId(null);
      } catch (err) {
          console.error(err);
      }
  };

  const handleSaveDomain = async () => {
      if(!activeDomainId) return;
      const domain = domains.find(d => d._id === activeDomainId);
      if(!domain) return;
      
      setIsSaving(true);
      try {
          const res = await fetch(`/api/domains/${domain._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ variables: domain.variables })
          });
          if(res.ok) {
              setMessage('Domain attributes saved!');
              setTimeout(() => setMessage(''), 3001);
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsSaving(false);
      }
  };

  const activeVariables = activeDomainId 
    ? (domains.find(d => d._id === activeDomainId)?.variables || {}) 
    : globalVariables;

  const updateVariable = (key: string, value: string) => {
      if(activeDomainId) {
          setDomains(domains.map(d => {
              if (d._id === activeDomainId) {
                  return { ...d, variables: { ...d.variables, [key]: value } };
              }
              return d;
          }));
      } else {
          setGlobalVariables(prev => ({ ...prev, [key]: value }));
      }
  };

  const handleAddVariable = () => {
    if(!newVarKey.trim()) return;
    const key = newVarKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    updateVariable(key, newVarValue);
    setNewVarKey('');
    setNewVarValue('');
  };

  const handleRemoveVariable = async (key: string) => {
    const proceed = await confirm('Delete Variable', `Are you sure you want to delete variable "${key}"?`);
    if (!proceed) return;
    if (activeDomainId) {
        setDomains(domains.map(d => {
            if (d._id === activeDomainId) {
                const updated = { ...d.variables };
                delete updated[key];
                return { ...d, variables: updated };
            }
            return d;
        }));
    } else {
        const updated = { ...globalVariables };
        delete updated[key];
        setGlobalVariables(updated);
    }
  };

  return (
    <motion.div 
      className="p-8 max-w-4xl mx-auto min-h-screen flex flex-col"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <header className="mb-8">
        <h2 className="text-4xl font-heading font-bold text-primary-dark mb-2">Ecosystem Settings</h2>
        <p className="text-gray-600">Configure your model keys and default preferences.</p>
      </header>

      <form onSubmit={handleSave} className="bg-white/90 backdrop-blur-md rounded-[2rem] p-8 shadow-xl shadow-primary/5 border border-primary/10 flex flex-col gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Default Testing Model</label>
          <select 
            value={settings.defaultModel}
            onChange={e => setSettings({...settings, defaultModel: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-heading"
          >
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Google)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Google)</option>
            <option value="gpt-4o">GPT-4o (OpenAI)</option>
            <option value="gpt-4o-mini">GPT-4o Mini (OpenAI)</option>
          </select>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Key className="w-4 h-4 text-primary" /> Gemini API Key
          </label>
          <input 
            type="password" 
            value={settings.geminiKey}
            onChange={e => setSettings({...settings, geminiKey: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm"
            placeholder="AIzaSy..."
          />
          <p className="text-xs text-gray-500 mt-2">Required for Gemini models. Securely stored in DB.</p>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Key className="w-4 h-4 text-primary" /> OpenAI API Key
          </label>
          <input 
            type="password" 
            value={settings.openAiKey}
            onChange={e => setSettings({...settings, openAiKey: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono text-sm"
            placeholder="sk-proj-..."
          />
          <p className="text-xs text-gray-500 mt-2">Required for GPT models.</p>
        </div>

        <div className="flex items-center justify-between pt-6">
            <span className="text-sm font-bold text-accent">{message}</span>
            <button 
                type="submit" 
                disabled={isSaving}
                className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
                <Save className="w-5 h-5" />
                Save Settings
            </button>
        </div>
      </form>

      <div className="mt-8 bg-white/90 backdrop-blur-md rounded-[2rem] p-6 md:p-8 shadow-xl shadow-primary/5 border border-primary/10 flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-xl text-primary-dark flex items-center gap-2">
              <Globe className="w-5 h-5" /> Domains & Properties
            </h3>
            <p className="text-sm text-gray-500 mt-1">Manage attributes per company or profile. Use <code className="bg-gray-100 px-1 rounded text-primary">{"{{"}VAR_NAME{"}}"}</code> in your branches.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
              <select 
                  value={activeDomainId || ''} 
                  onChange={e => setActiveDomainId(e.target.value || null)}
                  className="w-full sm:w-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              >
                  <option value="">Global Fallback</option>
                  {domains.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
              </select>
          </div>
        </header>

        {/* Domain Creation UI */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
           <input 
               value={newDomainName}
               onChange={e => setNewDomainName(e.target.value)}
               placeholder="New Workspace/Domain Name..."
               className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full sm:flex-1 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
           />
           <button onClick={handleCreateDomain} disabled={!newDomainName.trim()} className="w-full sm:w-auto bg-primary/10 text-primary-dark font-bold px-6 py-2 rounded-xl hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
               <Plus className="w-4 h-4" /> Add Domain
           </button>
        </div>

        {/* Workspaces/Domains Management List */}
        {domains.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {domains.map(d => (
              <div key={d._id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors shadow-sm">
                <span className="text-sm font-medium text-gray-700">{d.name}</span>
                <button 
                  onClick={() => handleDeleteDomain(d._id)} 
                  className="text-gray-400 hover:text-red-500 rounded-lg p-0.5 transition-colors"
                  title={`Delete ${d.name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                 {activeDomainId ? `Editing: ${domains.find(d => d._id === activeDomainId)?.name}` : 'Editing: Global Settings'}
             </span>
             {activeDomainId && (
                 <button onClick={() => handleDeleteDomain(activeDomainId)} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1">
                     <Trash2 className="w-3 h-3" /> Delete Domain
                 </button>
             )}
          </div>

          {Object.entries(activeVariables).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200">
              <div className="w-1/3 min-w-[150px]">
                <div className="text-xs font-bold text-primary px-3 py-2 bg-primary/5 rounded-lg font-mono">
                  {key}
                </div>
              </div>
              <input 
                value={value}
                onChange={e => updateVariable(key, e.target.value)}
                placeholder="Value..."
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono"
              />
              <button 
                onClick={() => handleRemoveVariable(key)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove Variable"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 mt-2 p-2 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <div className="w-1/3 min-w-[150px]">
              <input 
                value={newVarKey}
                onChange={e => setNewVarKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                placeholder="NEW_VAR"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono uppercase"
              />
            </div>
            <input 
              value={newVarValue}
              onChange={e => setNewVarValue(e.target.value)}
              placeholder="Value..."
              onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm font-mono"
            />
            <button 
              onClick={handleAddVariable}
              disabled={!newVarKey.trim()}
              className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
              title="Add Variable"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3">
             <label className="text-sm font-semibold text-gray-700">Auto-Extract Details</label>
             <p className="text-xs text-gray-500">Paste text about a company, project, or brand. The AI will extract key-value data automatically and map it to {activeDomainId ? 'this Domain' : 'Global variables'}.</p>
             <div className="flex gap-3">
               <textarea id="analyzeTextArea" rows={3} placeholder="Paste company description or context here..." className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:border-primary/50 text-sm resize-none"></textarea>
               <button type="button" onClick={async () => {
                   const ta = document.getElementById('analyzeTextArea') as HTMLTextAreaElement;
                   if(!ta || !ta.value.trim()) return;
                   setIsSaving(true);
                   try {
                       const res = await fetch('/api/settings/analyze-attributes', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ rawText: ta.value })
                       });
                       const data = await res.json();
                       if(data.attributes) {
                           Object.entries(data.attributes).forEach(([k, v]) => {
                               updateVariable(k, typeof v === 'string' ? v : String(v));
                           });
                           ta.value = '';
                           setMessage('Attributes extracted successfully.');
                       } else if(data.error) {
                           setMessage(data.error);
                       }
                   } catch (e) {
                       setMessage('Failed to extract attributes.');
                   } finally {
                       setIsSaving(false);
                   }
               }} className="bg-accent text-accent-dark font-bold hover:bg-accent/80 rounded-xl px-6 transition-colors shadow-sm disabled:opacity-50" disabled={isSaving}>
                   Analyze
               </button>
             </div>
          </div>
          
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
             <button 
                type="button"
                onClick={activeDomainId ? handleSaveDomain : handleSave}
                className="text-sm font-bold text-primary hover:text-primary-dark flex items-center gap-2 transition-colors"
                disabled={isSaving}
             >
                <Save className="w-4 h-4" /> Save Attributes
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
