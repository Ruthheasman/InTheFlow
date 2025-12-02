import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { NodeData, ToolType, Connection } from './types';
import { Icons } from './constants';

interface HistoryState {
  nodes: NodeData[];
  connections: Connection[];
}

export default function App() {
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  
  // History Stack
  const [history, setHistory] = useState<HistoryState[]>([{ nodes: [], connections: [] }]);
  const [historyStep, setHistoryStep] = useState(0);

  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from system preference
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  const recordHistory = (newNodes: NodeData[], newConnections: Connection[]) => {
    // Slice history if we are in the middle of the stack
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push({ nodes: newNodes, connections: newConnections });
    
    // Limit history size if needed (optional, keeping simple for now)
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      const prevState = history[prevStep];
      setNodes(prevState.nodes);
      setConnections(prevState.connections);
      setHistoryStep(prevStep);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      const nextState = history[nextStep];
      setNodes(nextState.nodes);
      setConnections(nextState.connections);
      setHistoryStep(nextStep);
    }
  };

  // When updating output data (content), we update the current history head in-place
  // to prevent data loss if the user undos a layout change later.
  // This means "Generating Content" is NOT an undoable action, but it persists across layout undos.
  const updateCurrentHistoryState = (updatedNodes: NodeData[], updatedConnections: Connection[]) => {
      const newHistory = [...history];
      newHistory[historyStep] = { nodes: updatedNodes, connections: updatedConnections };
      setHistory(newHistory);
  };

  const addNode = (type: ToolType) => {
    const newNode: NodeData = {
      id: Date.now().toString(),
      type,
      x: 100 + (nodes.length * 30), // Cascading initial position
      y: 100 + (nodes.length * 30),
      title: type,
      width: 400
    };
    const nextNodes = [...nodes, newNode];
    setNodes(nextNodes);
    recordHistory(nextNodes, connections);
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

            <div className="flex items-center gap-2">
                {/* Undo / Redo */}
               <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mr-2">
                   <button 
                     onClick={undo}
                     disabled={historyStep === 0}
                     className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors rounded-md"
                     title="Undo"
                   >
                      <Icons.Undo className="w-4 h-4" />
                   </button>
                   <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                   <button 
                     onClick={redo}
                     disabled={historyStep === history.length - 1}
                     className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors rounded-md"
                     title="Redo"
                   >
                      <Icons.Redo className="w-4 h-4" />
                   </button>
               </div>

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
                 className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none"
                 onClick={handleGenerateAll}
               >
                  <Icons.Sparkles className="w-4 h-4" />
                  Generate All
               </button>
            </div>
          </div>

          {/* Main Workspace */}
          <Workspace 
             nodes={nodes} 
             setNodes={setNodes} 
             connections={connections}
             setConnections={setConnections}
             saveHistory={recordHistory}
             updateCurrentHistoryState={updateCurrentHistoryState}
             isDarkMode={darkMode} 
          />
        </div>
      </div>
    </div>
  );
}