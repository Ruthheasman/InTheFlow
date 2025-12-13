import React, { useRef, useState, useEffect } from 'react';
import { Icons } from '../constants';

interface NodeWrapperProps {
  id: string;
  x: number;
  y: number;
  title: string;
  color: string;
  icon: React.FC<{ className?: string }>;
  pan: { x: number, y: number }; // Received pan offset
  onMove: (id: string, x: number, y: number) => void;
  onMoveEnd: (id: string) => void;
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
  pan,
  onMove,
  onMoveEnd,
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
    
    // Stop propagation so workspace doesn't pan
    e.stopPropagation();

    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent dragging if clicking close or controls
    if ((e.target as HTMLElement).closest('button')) return;
    
    // Stop propagation only if single touch (intended drag)
    // If multi-touch, let it bubble for pan/zoom on workspace
    if (e.touches.length === 1) {
        e.stopPropagation();
        
        if (nodeRef.current) {
          const rect = nodeRef.current.getBoundingClientRect();
          const touch = e.touches[0];
          setOffset({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
          });
        }
        setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Calculate new position relative to canvas origin, accounting for sidebar (256) and pan
        const newX = e.clientX - offset.x - 256 - pan.x;
        const newY = e.clientY - offset.y - pan.y;
        onMove(id, newX, newY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        // Prevent scrolling on touch devices while dragging
        if (e.cancelable) e.preventDefault();
        
        const touch = e.touches[0];
        const newX = touch.clientX - offset.x - 256 - pan.x;
        const newY = touch.clientY - offset.y - pan.y;
        onMove(id, newX, newY);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onMoveEnd(id);
      }
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        onMoveEnd(id);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, offset, id, onMove, onMoveEnd, pan]);

  return (
    <div
      ref={nodeRef}
      style={{
        transform: `translate(${x}px, ${y}px)`,
        position: 'absolute',
        width: '400px',
        zIndex: isDragging ? 50 : 10
      }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col transition-shadow hover:shadow-xl group"
    >
      {/* Input Handle (Left) */}
      <div 
        className="absolute -left-3 top-8 w-6 h-6 flex items-center justify-center cursor-crosshair z-30"
        onMouseUp={(e) => { e.stopPropagation(); onConnectEnd(id); }}
        onTouchEnd={(e) => { e.stopPropagation(); onConnectEnd(id); }}
      >
        <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 rounded-full hover:bg-indigo-500 hover:scale-125 transition-all shadow-sm" />
      </div>

      {/* Header / Drag Handle */}
      <div
        className={`node-drag-handle p-3 rounded-t-xl flex items-center justify-between border-b border-gray-100 dark:border-gray-700 ${color} bg-opacity-20 dark:bg-opacity-20 cursor-grab active:cursor-grabbing select-none touch-none`}
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Icon className="w-5 h-5 opacity-70" />
          <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Visual Grip Handle for Mobile */}
          <div className="md:hidden text-gray-400 dark:text-gray-500 opacity-50">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="9" x2="16" y2="9"></line><line x1="8" y1="15" x2="16" y2="15"></line></svg>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(id); }}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors p-1"
            onTouchEnd={(e) => {
                 e.stopPropagation();
                 onRemove(id);
            }}
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="p-4 bg-white dark:bg-gray-800 rounded-b-xl min-h-[100px] transition-colors"
        onMouseDown={(e) => e.stopPropagation()} // Stop propagation on content interaction too
        onTouchStart={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      {/* Output Handle (Right) */}
      <div 
        className="absolute -right-3 top-8 w-6 h-6 flex items-center justify-center cursor-crosshair z-30"
        onMouseDown={(e) => {
            e.stopPropagation();
            onConnectStart(id, 'source');
        }}
        onTouchStart={(e) => {
            e.stopPropagation();
            onConnectStart(id, 'source');
        }}
      >
         <div className="w-3 h-3 bg-indigo-500 border-2 border-white dark:border-gray-800 rounded-full hover:scale-125 transition-all shadow-sm" />
      </div>
    </div>
  );
};