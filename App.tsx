import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { NodeData, ToolType } from './types';
import { Icons } from './constants';

export default function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from system preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  const addNode = (type: ToolType) => {
    const newNode: NodeData = {
      id: Date.now().toString(),
      type,
      x: 100 + (nodes.length * 30), // Cascading initial position
      y: 100 + (nodes.length * 30),
      title: type,
      width: 400
    };
    setNodes([...nodes, newNode]);
  };

  const handleGenerateAll = () => {
    // Placeholder for global generation logic
    alert("Starting global generation sequence...");
  };

  const handleOpenApiKey = async () => {
    const win = window as any;
    if (win.aistudio && win.aistudio.openSelectKey) {
      await win.aistudio.openSelectKey();
    } else {
      alert("API Key selection is managed by the AI Studio environment when generating videos.");
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
        <Sidebar onAddTool={addNode} />
        
        <div className="flex flex-col flex-1 relative">
          {/* Top Bar */}
          <div className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6 z-10 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
               <span className="font-medium text-gray-800 dark:text-gray-200">Untitled Project</span>
               <span className="text-gray-300 dark:text-gray-700">/</span>
               <span>Last edited just now</span>
            </div>

            <div className="flex items-center gap-3">
               <button 
                 onClick={handleOpenApiKey}
                 className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                 title="Manage API Key"
               >
                  <Icons.Key className="w-5 h-5" />
               </button>

               <button 
                 onClick={() => setDarkMode(!darkMode)}
                 className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
               >
                  {darkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
               </button>

               <button 
                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none"
                 onClick={handleGenerateAll}
               >
                  <Icons.Sparkles className="w-4 h-4" />
                  Generate All
               </button>
               <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400">
                  <Icons.Layout className="w-5 h-5" />
               </button>
            </div>
          </div>

          {/* Main Workspace */}
          <Workspace nodes={nodes} setNodes={setNodes} isDarkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}