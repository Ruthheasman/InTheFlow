import React from 'react';
import { TOOLS, Icons } from '../constants';
import { ToolType } from '../types';

interface SidebarProps {
  onAddTool: (type: ToolType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onAddTool }) => {
  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col z-20 shadow-sm transition-colors duration-200">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-1.5 rounded-lg text-white shadow-sm">
            <Icons.Wave className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-normal font-['Pacifico'] bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-500 tracking-wide">
            intheflow
          </h1>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 pl-1">Multimodal Creative Studio</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">Generators</p>
        
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onAddTool(tool.id as ToolType)}
            className="w-full text-left p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group border border-transparent hover:border-gray-100 dark:hover:border-gray-700 flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-md flex items-center justify-center ${tool.color} transition-transform group-hover:scale-105`}>
              <tool.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{tool.name}</div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{tool.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Pro Tip:</strong> Drag nodes around the infinite canvas to organize your project workflow.
          </p>
        </div>
      </div>
    </div>
  );
};