"use client";

import dynamic from 'next/dynamic';

const PromptEditor = dynamic(() => import('./PromptEditorComponent'), {
  ssr: false,
  loading: () => <div className="p-12 text-center text-primary font-semibold">Gathering roots...</div>
});

export default function Page() {
  return <PromptEditor />;
}
