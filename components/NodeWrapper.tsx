import React, { useRef, useState, useEffect } from 'react';
import { Icons } from '../constants';

interface NodeWrapperProps {
  id: string;
  x: number;
  y: number;
  title: string;
  color: string;
  icon: React.FC<{ className?: string }>;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  onConnectStart: (nodeId: string, handleType: 'source') => void;
  onConnectEnd: (nodeId: string) => void;
  children: React.ReactNode;
}

export const NodeWrapper: React.FC<NodeWrapperProps> = ({
  id,
  x,
  y,
  title,
  color,
  icon: Icon,
  onMove,
  onRemove,
  onConnectStart,
  onConnectEnd,
  children
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent dragging if clicking close or controls
    if ((e.target as HTMLElement).closest('button')) return;
    
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - offset.x - 256; // 256 is sidebar width
        const newY = e.clientY - offset.y;
        onMove(id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset, id, onMove]);

  return (
    <div
      ref={nodeRef}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        position: 'absolute',
        width: '400px',
        zIndex: isDragging ? 50 : 10
      }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col transition-all hover:shadow-xl group"
    >
      {/* Input Handle (Left) */}
      <div 
        className="absolute -left-3 top-8 w-6 h-6 flex items-center justify-center cursor-crosshair z-20"
        onMouseUp={() => onConnectEnd(id)}
      >
        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 rounded-full hover:bg-indigo-500 hover:scale-125 transition-all shadow-sm" />
      </div>

      {/* Header / Drag Handle */}
      <div
        className={`node-drag-handle p-3 rounded-t-xl flex items-center justify-between border-b border-gray-100 dark:border-gray-700 ${color} bg-opacity-20 dark:bg-opacity-20 cursor-grab active:cursor-grabbing select-none`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 opacity-70" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{title}</span>
        </div>
        <button 
          onClick={() => onRemove(id)}
          className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1"
        >
          <Icons.X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 bg-white dark:bg-gray-800 rounded-b-xl min-h-[100px] transition-colors">
        {children}
      </div>

      {/* Output Handle (Right) */}
      <div 
        className="absolute -right-3 top-8 w-6 h-6 flex items-center justify-center cursor-crosshair z-20"
        onMouseDown={(e) => {
            e.stopPropagation();
            onConnectStart(id, 'source');
        }}
      >
         <div className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-gray-800 rounded-full hover:scale-125 transition-all shadow-sm" />
      </div>
    </div>
  );
};