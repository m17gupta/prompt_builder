"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Leaf, PlusCircle, LayoutGrid, Import, Settings, Globe, Menu, X, ChevronLeft, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface Domain {
  _id: string;
  name: string;
  variables: Record<string, string>;
}

function DomainDropdown({ 
  domains, 
  activeDomainId, 
  onSelect, 
  onDelete,
  isHeader = false
}: { 
  domains: Domain[]; 
  activeDomainId: string | null; 
  onSelect: (id: string | null) => void; 
  onDelete: (id: string) => void;
  isHeader?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeDomain = domains.find(d => d._id === activeDomainId);
  const activeName = activeDomain ? activeDomain.name : 'Global (All Prompts)';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border border-gray-200 text-gray-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-sm hover:bg-gray-50 transition-all text-left truncate ${
          isHeader 
            ? 'pl-7 sm:pl-9 pr-2 py-1.5 sm:py-2 text-xs sm:text-sm' 
            : 'pl-9 pr-3 py-2.5 text-sm font-medium'
        }`}
      >
        <span className="truncate pr-1.5">{activeName}</span>
        <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 left-auto sm:left-0 min-w-[200px] sm:w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto py-1.5 custom-scroll animate-fade-in">
          <div 
            onClick={() => {
              onSelect(null);
              setIsOpen(false);
            }}
            className={`flex items-center justify-between px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-primary/5 transition-colors ${!activeDomainId ? 'text-primary-dark font-bold bg-primary/5' : 'text-gray-700'}`}
          >
            <span className="truncate">Global (All Prompts)</span>
          </div>

          {domains.map(d => {
            const isSelected = d._id === activeDomainId;
            return (
              <div 
                key={d._id}
                onClick={() => {
                  onSelect(d._id);
                  setIsOpen(false);
                }}
                className={`group flex items-center justify-between px-3 py-2 text-xs sm:text-sm cursor-pointer hover:bg-primary/5 transition-colors ${isSelected ? 'text-primary-dark font-bold bg-primary/5' : 'text-gray-700'}`}
              >
                <span className="truncate flex-1 pr-2">{d.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(d._id);
                  }}
                  className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Navigation({ 
  onClose, 
  isCollapsed, 
  onToggleCollapse,
  deleteDomain
}: { 
  onClose: () => void; 
  isCollapsed: boolean; 
  onToggleCollapse: () => void; 
  deleteDomain: (id: string) => Promise<void>;
}) {
  const pathname = usePathname();
  const { domains, activeDomainId, setActiveDomainId } = useAppContext();

  const activeDomain = domains.find(d => d._id === activeDomainId);
  const activeDomainName = activeDomain ? activeDomain.name : 'Global (All Prompts)';

  return (
    <nav className={`bg-surface border-r border-primary/20 h-screen flex flex-col shadow-2xl relative transition-all duration-300 w-72 ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}>
      <button 
         onClick={onClose}
         className="absolute right-4 top-6 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors md:hidden"
      >
          <X className="w-5 h-5" />
      </button>

      <div className={`border-b border-primary/10 flex items-center transition-all duration-300 ${
        isCollapsed ? 'lg:px-4 lg:py-6 lg:justify-start' : 'p-6 gap-3'
      } overflow-hidden`}>
        <div className={`bg-primary/10 text-primary-dark rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'lg:w-8 lg:h-8 lg:ml-1' : 'w-10 h-10'
        }`}>
          <Leaf className={`transition-all duration-300 ${isCollapsed ? 'lg:w-5 lg:h-5' : 'w-6 h-6'}`} />
        </div>
        <h1 className={`font-heading font-bold text-xl text-primary-dark tracking-tight transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>EcoPrompt</h1>
      </div>

      {/* Collapse/Expand Toggle Button (Desktop only) */}
      <button
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute top-[44px] -right-3 transform -translate-y-1/2 bg-white border border-primary/20 rounded-full p-1 shadow-md hover:bg-gray-50 hover:text-primary z-50 text-gray-400 transition-colors"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Expanded Domain Selector */}
      <div className={`p-4 border-b border-primary/5 transition-all duration-300 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
         <label className="text-xs font-bold text-gray-500 mb-2 block">Active Project / Domain</label>
         <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Globe className="w-4 h-4 text-primary" />
             </div>
             <DomainDropdown
                 domains={domains}
                 activeDomainId={activeDomainId}
                 onSelect={setActiveDomainId}
                 onDelete={deleteDomain}
             />
         </div>
      </div>

      {/* Collapsed Domain Selector (Desktop only) */}
      {isCollapsed && (
         <div className="hidden lg:flex p-4 border-b border-primary/5 justify-center">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer" title={`Active Domain: ${activeDomainName}`}>
               <Globe className="w-5 h-5" />
             </div>
         </div>
      )}

      <div className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scroll">
        <Link 
          href="/" 
          onClick={onClose} 
          title={isCollapsed ? "Dashboard" : undefined}
          className={`flex items-center transition-all ${isCollapsed ? 'justify-start gap-3 px-4 py-3 lg:justify-center lg:p-3 lg:w-12 lg:mx-auto' : 'gap-3 px-4 py-3'} ${pathname === '/' ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <LayoutGrid className="w-5 h-5 flex-shrink-0" />
          <span className={`transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Dashboard</span>
        </Link>
        <Link 
          href="/import" 
          onClick={onClose} 
          title={isCollapsed ? "Import" : undefined}
          className={`flex items-center transition-all ${isCollapsed ? 'justify-start gap-3 px-4 py-3 lg:justify-center lg:p-3 lg:w-12 lg:mx-auto' : 'gap-3 px-4 py-3'} ${pathname === '/import' ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Import className="w-5 h-5 flex-shrink-0" />
          <span className={`transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Import</span>
        </Link>
      </div>

      <div className="px-4 pb-6 space-y-2">
        <Link 
          href="/settings" 
          onClick={onClose} 
          title={isCollapsed ? "Settings" : undefined}
          className={`flex items-center transition-all ${isCollapsed ? 'justify-start gap-3 px-4 py-3 lg:justify-center lg:p-3 lg:w-12 lg:mx-auto' : 'gap-3 px-4 py-3'} ${pathname === '/settings' ? 'bg-primary/10 text-primary-dark font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          <span className={`transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}`}>Settings</span>
        </Link>
      </div>
      
      <div className={`transition-all duration-300 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
        <div className="p-6 border-t border-primary/10">
          <div className="p-4 bg-accent/10 rounded-2xl">
            <h3 className="font-heading font-semibold text-accent-dark mb-2">Grow your Prompts</h3>
            <p className="text-sm text-gray-600 mb-4">Break down large prompts into modular, version-controlled chunks.</p>
          </div>
        </div>
      </div>


    </nav>
  );
}

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { domains, activeDomainId, setActiveDomainId, deleteDomain } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapse state from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const nextValue = !isCollapsed;
    setIsCollapsed(nextValue);
    localStorage.setItem('sidebar-collapsed', String(nextValue));
  };

  // Close sidebar on mobile when navigating
  useEffect(() => {
     setIsSidebarOpen(false);
  }, [pathname]);

  // Handle window resizing to keep sidebar open/closed properly
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-background text-gray-800 font-sans selection:bg-primary/30 overflow-hidden relative">
      
      {/* Overlay for Sidebar (Mobile only) */}
      <AnimatePresence>
         {isSidebarOpen && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px] lg:hidden"
               onClick={() => setIsSidebarOpen(false)}
            />
         )}
      </AnimatePresence>

      {/* Sidebar Overlay Drawer (Mobile) or Persistent (Desktop) */}
      <div className={`fixed lg:relative inset-y-0 left-0 z-50 transform lg:transform-none transition-all duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
         <Navigation 
           onClose={() => setIsSidebarOpen(false)} 
           isCollapsed={isCollapsed}
           onToggleCollapse={toggleCollapse}
           deleteDomain={deleteDomain}
         />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-auto flex flex-col w-full h-full">
        
        {/* Global Header with Menu Toggle */}
        <div className="flex items-center p-3 sm:p-4 border-b border-primary/10 bg-surface/80 backdrop-blur-md sticky top-0 z-45 shadow-sm gap-4">
           <button 
               onClick={() => setIsSidebarOpen(true)} 
               className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors shadow-sm border border-gray-200 bg-white lg:hidden"
               title="Open Navigation"
           >
               <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
           </button>
           <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 text-primary-dark rounded-lg flex items-center justify-center">
                 <Leaf className="w-5 h-5" />
              </div>
              <h1 className="font-heading font-bold text-lg text-primary-dark tracking-tight hidden sm:block">EcoPrompt</h1>
           </Link>

           <div className="ml-auto relative w-40 sm:w-48">
               <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                   <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
               </div>
                <DomainDropdown
                    domains={domains}
                    activeDomainId={activeDomainId}
                    onSelect={setActiveDomainId}
                    onDelete={deleteDomain}
                    isHeader={true}
                />
           </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 relative mandala-bg min-h-0 flex flex-col">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
