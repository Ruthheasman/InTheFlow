import React, { useState, useRef, useEffect } from 'react';
import { NodeWrapper } from './NodeWrapper';
import { NodeData, ToolType, Connection } from '../types';
import { TOOLS } from '../constants';

// Tool Components
import { ImageGen } from './tools/ImageGen';
import { VideoGen } from './tools/VideoGen';
import { ScriptGen } from './tools/ScriptGen';
import { VoiceGen } from './tools/VoiceGen';
import { Sequencer } from './tools/Sequencer';
import { ImageSource } from './tools/ImageSource';
import { VideoSource } from './tools/VideoSource';

interface WorkspaceProps {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  saveHistory: (nodes: NodeData[], connections: Connection[]) => void;
  updateCurrentHistoryState: (nodes: NodeData[], connections: Connection[]) => void;
  isDarkMode: boolean;
}

export const Workspace: React.FC<WorkspaceProps> = ({ 
    nodes, 
    setNodes, 
    connections, 
    setConnections, 
    saveHistory,
    updateCurrentHistoryState,
    isDarkMode 
}) => {
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Panning State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 }); // Pan value at start of drag
  const dragStartRef = useRef({ x: 0, y: 0 }); // Mouse/Touch position at start

  // --- Node Movement Handlers ---
  const handleMove = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleMoveEnd = (id: string) => {
    saveHistory(nodes, connections);
  };

  const handleRemove = (id: string) => {
    const nextNodes = nodes.filter(n => n.id !== id);
    const nextConnections = connections.filter(c => c.sourceId !== id && c.targetId !== id);
    setNodes(nextNodes);
    setConnections(nextConnections);
    saveHistory(nextNodes, nextConnections);
  };

  const handleUpdateNodeOutput = (id: string, outputData: any) => {
    const nextNodes = nodes.map(n => n.id === id ? { ...n, outputData } : n);
    setNodes(nextNodes);
    updateCurrentHistoryState(nextNodes, connections);
  };

  // --- Connection Handlers ---
  const handleConnectStart = (nodeId: string) => {
    setConnectingSourceId(nodeId);
  };

  const handleConnectEnd = (targetId: string) => {
    if (connectingSourceId && connectingSourceId !== targetId) {
      const exists = connections.find(c => c.sourceId === connectingSourceId && c.targetId === targetId);
      if (!exists) {
        const nextConnections = [...connections, {
          id: `${connectingSourceId}-${targetId}`,
          sourceId: connectingSourceId,
          targetId: targetId
        }];
        setConnections(nextConnections);
        saveHistory(nodes, nextConnections);
      }
    }
    setConnectingSourceId(null);
    setMousePos(null);
  };

  // --- Workspace Panning Handlers ---
  
  // Mouse Pan (Middle Click or Left Click on BG)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === e.currentTarget) { // Left click only on bg
       setIsPanning(true);
       dragStartRef.current = { x: e.clientX, y: e.clientY };
       panStartRef.current = { ...pan };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        setPan({
            x: panStartRef.current.x + dx,
            y: panStartRef.current.y + dy
        });
    }
    // Update Connection Drag Line
    if (connectingSourceId) {
       // Adjust mouse position by sidebar (256) and pan
       setMousePos({ 
           x: e.clientX - 256 - pan.x, 
           y: e.clientY - pan.y 
       });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (connectingSourceId) {
        setConnectingSourceId(null);
        setMousePos(null);
    }
  };

  // Touch Pan (2-finger)
  const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
          setIsPanning(true);
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const cx = (t1.clientX + t2.clientX) / 2;
          const cy = (t1.clientY + t2.clientY) / 2;
          
          dragStartRef.current = { x: cx, y: cy };
          panStartRef.current = { ...pan };
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (isPanning && e.touches.length === 2) {
          e.preventDefault(); // Prevent native scroll
          const t1 = e.touches[0];
          const t2 = e.touches[1];
          const cx = (t1.clientX + t2.clientX) / 2;
          const cy = (t1.clientY + t2.clientY) / 2;

          const dx = cx - dragStartRef.current.x;
          const dy = cy - dragStartRef.current.y;

          setPan({
              x: panStartRef.current.x + dx,
              y: panStartRef.current.y + dy
          });
      }
      // Update Connection Drag Line (Use first touch if connecting)
      if (connectingSourceId && e.touches.length === 1) {
          const t = e.touches[0];
          setMousePos({ 
             x: t.clientX - 256 - pan.x, 
             y: t.clientY - pan.y 
          });
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      if (e.touches.length < 2) {
          setIsPanning(false);
      }
      if (connectingSourceId) {
          setConnectingSourceId(null);
          setMousePos(null);
      }
  };

  // --- Rendering ---

  const renderToolContent = (node: NodeData) => {
    const inputConnections = connections.filter(c => c.targetId === node.id);
    const inputNodes = inputConnections.map(c => nodes.find(n => n.id === c.sourceId)).filter(Boolean) as NodeData[];
    const primaryInput = inputNodes.length > 0 ? inputNodes[0].outputData : undefined;
    const allInputs = inputNodes.map(n => n.outputData).filter(Boolean);
    const commonProps = { onOutputChange: (data: any) => handleUpdateNodeOutput(node.id, data) };

    switch (node.type) {
      case ToolType.IMAGE_GENERATOR: return <ImageGen {...commonProps} />;
      case ToolType.VIDEO_GENERATOR: return <VideoGen inputData={primaryInput} {...commonProps} />;
      case ToolType.RESEARCH_AGENT: return <ScriptGen type="research" {...commonProps} />;
      case ToolType.SCRIPT_WRITER: return <ScriptGen type="script" {...commonProps} />;
      case ToolType.CHARACTER_GEN: return <ScriptGen type="character" {...commonProps} />;
      case ToolType.VOICE_GENERATOR: return <VoiceGen {...commonProps} />;
      case ToolType.SCENE_CREATOR: return <ScriptGen type="script" {...commonProps} />;
      case ToolType.SEQUENCER: return <Sequencer inputs={allInputs} />;
      case ToolType.IMAGE_SOURCE: return <ImageSource {...commonProps} />;
      case ToolType.VIDEO_SOURCE: return <VideoSource {...commonProps} />;
      default: return <div className="p-4 text-gray-400">Tool not implemented.</div>;
    }
  };

  const renderConnections = () => {
    const pathColor = isDarkMode ? '#475569' : '#cbd5e1'; 
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" ref={svgRef}>
            {connections.map(conn => {
                const source = nodes.find(n => n.id === conn.sourceId);
                const target = nodes.find(n => n.id === conn.targetId);
                if (!source || !target) return null;

                const sx = source.x + 400; 
                const sy = source.y + 35; 
                const tx = target.x; 
                const ty = target.y + 35;
                const d = `M ${sx} ${sy} C ${sx + 50} ${sy}, ${tx - 50} ${ty}, ${tx} ${ty}`;

                return (
                    <g key={conn.id}>
                        <path d={d} stroke={pathColor} strokeWidth="4" fill="none" />
                        <path d={d} stroke="#6366f1" strokeWidth="2" fill="none" className="animate-pulse-slow opacity-60" />
                    </g>
                );
            })}
            
            {/* Active Dragging Line */}
            {connectingSourceId && mousePos && (() => {
                const source = nodes.find(n => n.id === connectingSourceId);
                if (!source) return null;
                const sx = source.x + 400;
                const sy = source.y + 35;
                const tx = mousePos.x;
                const ty = mousePos.y;
                const d = `M ${sx} ${sy} C ${sx + 50} ${sy}, ${tx - 50} ${ty}, ${tx} ${ty}`;
                 return <path d={d} stroke="#6366f1" strokeWidth="2" strokeDasharray="5,5" fill="none" />;
            })()}
        </svg>
    );
  };

  const gridDotColor = isDarkMode ? '#334155' : '#cbd5e1'; 

  return (
    <div 
      className="relative flex-1 bg-slate-50 dark:bg-gray-950 overflow-hidden cursor-crosshair transition-colors duration-200"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        backgroundImage: `radial-gradient(${gridDotColor} 1px, transparent 1px)`, 
        backgroundSize: '24px 24px',
        backgroundPosition: `${pan.x}px ${pan.y}px` // Move grid with pan
      }}
    >
        {/* Content Container with Transform */}
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px)`, width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
            {renderConnections()}

            {nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none select-none">
                    <div className="text-center" style={{ transform: `translate(${-pan.x}px, ${-pan.y}px)` }}> {/* Counter transform static text */}
                        <h3 className="text-2xl font-bold text-gray-400 dark:text-gray-600">Empty Workspace</h3>
                        <p className="text-gray-400 dark:text-gray-600">Select a tool from the sidebar to begin</p>
                    </div>
                </div>
            )}

            {nodes.map(node => {
              const toolDef = TOOLS.find(t => t.id === node.type);
              if (!toolDef) return null;

              return (
                <NodeWrapper
                  key={node.id}
                  id={node.id}
                  x={node.x}
                  y={node.y}
                  title={toolDef.name}
                  color={toolDef.color}
                  icon={toolDef.icon}
                  pan={pan}
                  onMove={handleMove}
                  onMoveEnd={handleMoveEnd}
                  onRemove={handleRemove}
                  onConnectStart={handleConnectStart}
                  onConnectEnd={handleConnectEnd}
                >
                  {renderToolContent(node)}
                </NodeWrapper>
              );
            })}
        </div>
        
        {/* Helper text for pan controls */}
        {nodes.length > 0 && (
             <div className="absolute bottom-4 right-4 bg-white/50 dark:bg-black/50 backdrop-blur px-3 py-1 rounded text-[10px] text-gray-500 pointer-events-none">
                 Pan: 2-finger drag or click-drag BG
             </div>
        )}
    </div>
  );
};