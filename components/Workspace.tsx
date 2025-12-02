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

  const handleMove = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleMoveEnd = (id: string) => {
    // Commit the new position to history
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
    // We update the current history state in-place to ensure data isn't lost on future undos,
    // but we don't create a new undo step for content generation.
    updateCurrentHistoryState(nextNodes, connections);
  };

  // Connection Logic
  const handleConnectStart = (nodeId: string) => {
    setConnectingSourceId(nodeId);
  };

  const handleConnectEnd = (targetId: string) => {
    if (connectingSourceId && connectingSourceId !== targetId) {
      // Check if exists
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

  // Track mouse for drawing the temp line
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (connectingSourceId) {
         setMousePos({ x: e.clientX - 256, y: e.clientY }); // 256 sidebar
      }
    };
    const handleMouseUp = () => {
        if (connectingSourceId) {
            setConnectingSourceId(null);
            setMousePos(null);
        }
    }
    
    if (connectingSourceId) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [connectingSourceId]);


  const renderToolContent = (node: NodeData) => {
    // Find inputs for this node
    const inputConnections = connections.filter(c => c.targetId === node.id);
    const inputNodes = inputConnections.map(c => nodes.find(n => n.id === c.sourceId)).filter(Boolean) as NodeData[];
    
    // For single input components, just grab the first valid output
    const primaryInput = inputNodes.length > 0 ? inputNodes[0].outputData : undefined;
    
    // For Sequencer, we pass all input nodes
    const allInputs = inputNodes.map(n => n.outputData).filter(Boolean);

    const commonProps = {
        onOutputChange: (data: any) => handleUpdateNodeOutput(node.id, data)
    };

    switch (node.type) {
      case ToolType.IMAGE_GENERATOR:
        return <ImageGen {...commonProps} />;
      case ToolType.VIDEO_GENERATOR:
        return <VideoGen inputData={primaryInput} {...commonProps} />;
      case ToolType.RESEARCH_AGENT:
        return <ScriptGen type="research" {...commonProps} />;
      case ToolType.SCRIPT_WRITER:
        return <ScriptGen type="script" {...commonProps} />;
      case ToolType.CHARACTER_GEN:
        return <ScriptGen type="character" {...commonProps} />;
      case ToolType.VOICE_GENERATOR:
        return <VoiceGen {...commonProps} />;
      case ToolType.SCENE_CREATOR:
        return <ScriptGen type="script" {...commonProps} />;
      case ToolType.SEQUENCER:
        return <Sequencer inputs={allInputs} />;
      case ToolType.IMAGE_SOURCE:
        return <ImageSource {...commonProps} />;
      case ToolType.VIDEO_SOURCE:
        return <VideoSource {...commonProps} />;
      default:
        return <div className="p-4 text-gray-400 dark:text-gray-500">Tool not implemented yet.</div>;
    }
  };

  // Render SVG Paths
  const renderConnections = () => {
    const pathColor = isDarkMode ? '#475569' : '#cbd5e1'; // slate-600 vs slate-300
    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" ref={svgRef}>
            {connections.map(conn => {
                const source = nodes.find(n => n.id === conn.sourceId);
                const target = nodes.find(n => n.id === conn.targetId);
                if (!source || !target) return null;

                const sx = source.x + 400; // Right side
                const sy = source.y + 35; // Approx header height center
                const tx = target.x; // Left side
                const ty = target.y + 35;

                // Bezier Curve
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

  const gridDotColor = isDarkMode ? '#334155' : '#cbd5e1'; // slate-700 vs slate-300

  return (
    <div 
      className="relative flex-1 bg-slate-50 dark:bg-gray-950 overflow-hidden cursor-crosshair transition-colors duration-200"
      style={{ 
        backgroundImage: `radial-gradient(${gridDotColor} 1px, transparent 1px)`, 
        backgroundSize: '24px 24px' 
      }}
    >
        {renderConnections()}

        {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none select-none">
                <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-400 dark:text-gray-600">Empty Workspace</h3>
                    <p className="text-gray-400 dark:text-gray-600">Select a tool from the sidebar to begin</p>
                </div>
            </div>
        )}

        {/* Render Nodes */}
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
  );
};