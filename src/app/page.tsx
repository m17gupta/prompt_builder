"use client";

import React from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../AppContext';
import Link from 'next/link';
import { PlusCircle, FileText, ArrowRight, TreePine, Clock, Trash2 } from 'lucide-react';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { prompts, deletePrompt, confirm } = useAppContext();

  return (
    <motion.div 
      className="p-8 max-w-6xl mx-auto"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <header className="mb-8 md:mb-12 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 text-center sm:text-left">
        <div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-dark mb-2">Your Ecosystem</h2>
          <p className="text-gray-600">Nurture and manage your prompt libraries.</p>
        </div>
        <Link href="/import" className="w-full sm:w-auto bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-full font-semibold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95">
          <PlusCircle className="w-5 h-5" />
          Plant a Seed
        </Link>
      </header>

      {prompts.length === 0 ? (
        <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl border border-primary/20 p-8 md:p-12 rounded-[2rem] text-center shadow-2xl shadow-primary/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex items-center justify-center">
            <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
               className="w-96 h-96 border-4 border-primary rounded-full border-dashed"
            />
          </div>
          <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <motion.div
               animate={{ y: [0, -10, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
               <TreePine className="w-12 h-12" />
            </motion.div>
          </div>
          <h3 className="text-xl md:text-2xl font-heading font-bold text-gray-800 mb-3 relative z-10">Your garden is empty</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto relative z-10 text-sm md:text-base">Start by importing a monolithic prompt. The system will automatically root and branch it into manageable chunks.</p>
          <Link href="/import" className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white px-8 py-3 md:py-4 rounded-full font-semibold transition-all hover:-translate-y-1 relative z-10">
            Import First Prompt
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={pageVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prompts.map(prompt => (
            <motion.div key={prompt._id} variants={itemVariants} className="h-full">
              <div className="bg-white/80 backdrop-blur-md border border-primary/10 p-6 rounded-3xl shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all border-l-4 border-l-primary group h-full flex flex-col relative overflow-hidden">
                <Link href={`/prompt/${prompt._id}`} className="absolute inset-0 z-0"></Link>
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 bg-primary/10 text-primary-dark rounded-2xl flex items-center justify-center pointer-events-none">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-accent/20 text-accent px-3 py-1 rounded-full uppercase tracking-wider">
                      v{prompt.version}
                    </span>
                    <button 
                       onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const proceed = await confirm('Delete Prompt', 'Are you sure you want to delete this prompt?');
                          if (proceed) {
                             deletePrompt(prompt._id);
                          }
                       }}
                       className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-20"
                       title="Delete Prompt"
                    >
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-heading font-bold text-gray-800 mb-2 line-clamp-2 relative z-10 pointer-events-none">{prompt.title}</h3>
                <p className="text-gray-500 text-sm mb-4 flex-1 line-clamp-3 relative z-10 pointer-events-none">{prompt.description}</p>
                
                <div className="flex flex-col gap-3 relative z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Last edited: {new Date(prompt.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-primary-dark font-medium pt-3 border-t border-gray-100">
                    <span>View Branches</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
