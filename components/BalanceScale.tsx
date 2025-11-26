import React, { useMemo } from 'react';
import { BlockData, ZoneId } from '../types';
import { MathBlock } from './MathBlock';

interface BalanceScaleProps {
  leftBlocks: BlockData[];
  rightBlocks: BlockData[];
  onDropBlock: (e: React.DragEvent, targetZone: ZoneId) => void;
  onDeleteBlock: (id: string) => void;
}

export const BalanceScale: React.FC<BalanceScaleProps> = ({
  leftBlocks,
  rightBlocks,
  onDropBlock,
  onDeleteBlock,
}) => {
  // Treat NaN (missing variables) as 0 for weight calculation
  const safeValue = (val: number) => isNaN(val) ? 0 : val;

  const leftTotal = useMemo(() => leftBlocks.reduce((acc, b) => acc + safeValue(b.value), 0), [leftBlocks]);
  const rightTotal = useMemo(() => rightBlocks.reduce((acc, b) => acc + safeValue(b.value), 0), [rightBlocks]);
  
  // Check if any block on the scale has an undefined variable (NaN)
  const hasUndefinedVar = useMemo(() => {
    return leftBlocks.some(b => isNaN(b.value)) || rightBlocks.some(b => isNaN(b.value));
  }, [leftBlocks, rightBlocks]);

  // If there is an undefined variable, we force the scale to be balanced (difference 0)
  // Otherwise, we calculate the actual difference.
  const difference = hasUndefinedVar ? 0 : rightTotal - leftTotal;
  
  // Calculate rotation angle (clamped between -20 and 20 degrees)
  const rotationAngle = Math.max(-20, Math.min(20, difference * 2));
  
  const symbol = useMemo(() => {
    // If undefined variable exists, express equality (or uncertainty treated as equality for balance)
    if (hasUndefinedVar) return '=';
    
    if (Math.abs(leftTotal - rightTotal) < 0.001) return '=';
    return leftTotal > rightTotal ? '>' : '<';
  }, [leftTotal, rightTotal, hasUndefinedVar]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      
      {/* Top Value Indicators (Floating Cards) */}
      <div className="absolute top-2 md:top-6 w-full flex justify-between px-2 md:px-20 lg:px-32 z-30 pointer-events-none">
        {/* Left Indicator */}
        <div className="flex flex-col items-center gap-1 transition-transform duration-300 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl md:rounded-2xl px-2 py-1.5 md:px-6 md:py-3 border border-indigo-100 min-w-[60px] md:min-w-[100px] text-center transform scale-90 md:scale-100 origin-top-left">
                <span className="hidden md:block text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Esquerda</span>
                <span className="text-lg md:text-3xl font-black text-indigo-600 tabular-nums">
                  {/* Show total, or maybe '?' if you wanted, but keeping existing logic for number display is usually safer unless requested */}
                  {Number(leftTotal.toFixed(2))}
                </span>
            </div>
        </div>
        
        {/* Central Symbol */}
        <div className="flex items-center justify-center -mt-1 md:mt-0 pointer-events-auto">
             <div className={`
                w-8 h-8 md:w-20 md:h-20 rounded-full bg-white shadow-xl flex items-center justify-center 
                text-lg md:text-5xl font-black text-transparent bg-clip-text 
                border-2 md:border-4 border-indigo-50 transition-colors duration-300
                ${hasUndefinedVar ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}
             `}>
                {symbol}
             </div>
        </div>

        {/* Right Indicator */}
        <div className="flex flex-col items-center gap-1 transition-transform duration-300 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-xl md:rounded-2xl px-2 py-1.5 md:px-6 md:py-3 border border-pink-100 min-w-[60px] md:min-w-[100px] text-center transform scale-90 md:scale-100 origin-top-right">
                <span className="hidden md:block text-xs font-bold text-pink-400 uppercase tracking-widest mb-1">Direita</span>
                <span className="text-lg md:text-3xl font-black text-pink-600 tabular-nums">{Number(rightTotal.toFixed(2))}</span>
            </div>
        </div>
      </div>

      {/* Main Balance Assembly Container */}
      {/* MOVED UP: top-[25%] on mobile to clear the bottom sheet */}
      <div className="absolute top-[25%] md:top-[35%] left-0 w-full flex justify-center z-20">
        
        {/* The Rotating Beam */}
        <div 
          className="relative w-[85%] md:w-[600px] h-3 md:h-6 bg-slate-700 rounded-full transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-2xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 origin-center"
          style={{ transform: `rotate(${rotationAngle}deg)` }}
        >
          {/* Pivot Point (Center Mechanism) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 bg-white rounded-full shadow-[inset_0_-4px_6px_rgba(0,0,0,0.1)] border-2 md:border-4 border-slate-200 z-20 flex items-center justify-center">
              <div className={`w-2 h-2 md:w-4 md:h-4 rounded-full shadow-inner transition-colors ${hasUndefinedVar ? 'bg-amber-400' : 'bg-slate-400'}`}></div>
          </div>

          {/* Left Pan Assembly */}
          <div className="absolute left-2 top-1/2 w-0 h-0">
            {/* Chain/Rope */}
            <div className="absolute top-0 left-0 w-0.5 md:w-1.5 h-[90px] md:h-[160px] bg-slate-300/80 origin-top -translate-x-1/2 rounded-full"></div>
            
            {/* Pan Container */}
            <div 
              className="absolute top-[90px] md:top-[160px] left-0 -translate-x-1/2 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ transform: `rotate(${-rotationAngle}deg)` }}
            >
              {/* The Pan Visual */}
              <div 
                onDragOver={handleDragOver}
                onDrop={(e) => onDropBlock(e, 'left')}
                className={`
                  w-[110px] md:w-56 min-h-[80px] md:min-h-[100px]
                  bg-indigo-500/10 backdrop-blur-md 
                  border border-indigo-200/50 border-b-4 border-b-indigo-300/50
                  rounded-xl md:rounded-3xl
                  flex flex-col items-center justify-end p-1.5 md:p-3 pb-2 md:pb-4
                  transition-all duration-300
                  shadow-xl
                  ${leftBlocks.length === 0 ? 'border-dashed border-2 opacity-80' : ''}
                `}
              >
                <div className="flex flex-col-reverse w-full gap-1 md:gap-2 items-center max-h-[140px] md:max-h-[300px] overflow-y-auto custom-scrollbar px-0.5">
                   {leftBlocks.map((block) => (
                     <MathBlock key={block.id} block={block} zone="left" onDelete={onDeleteBlock} />
                   ))}
                   {leftBlocks.length === 0 && (
                      <div className="text-indigo-400 text-[10px] md:text-sm py-2 md:py-6 font-medium text-center leading-tight">
                          Arraste<br/>aqui
                      </div>
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Pan Assembly */}
          <div className="absolute right-2 top-1/2 w-0 h-0">
             {/* Chain */}
             <div className="absolute top-0 right-0 w-0.5 md:w-1.5 h-[90px] md:h-[160px] bg-slate-300/80 origin-top translate-x-1/2 rounded-full"></div>
             
             {/* Pan Container */}
             <div 
              className="absolute top-[90px] md:top-[160px] right-0 translate-x-1/2 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ transform: `rotate(${-rotationAngle}deg)` }}
            >
              {/* The Pan Visual */}
              <div 
                 onDragOver={handleDragOver}
                 onDrop={(e) => onDropBlock(e, 'right')}
                 className={`
                  w-[110px] md:w-56 min-h-[80px] md:min-h-[100px]
                  bg-pink-500/10 backdrop-blur-md 
                  border border-pink-200/50 border-b-4 border-b-pink-300/50
                  rounded-xl md:rounded-3xl
                  flex flex-col items-center justify-end p-1.5 md:p-3 pb-2 md:pb-4
                  transition-all duration-300
                  shadow-xl
                  ${rightBlocks.length === 0 ? 'border-dashed border-2 opacity-80' : ''}
                 `}
              >
                <div className="flex flex-col-reverse w-full gap-1 md:gap-2 items-center max-h-[140px] md:max-h-[300px] overflow-y-auto custom-scrollbar px-0.5">
                  {rightBlocks.map((block) => (
                     <MathBlock key={block.id} block={block} zone="right" onDelete={onDeleteBlock} />
                   ))}
                   {rightBlocks.length === 0 && (
                      <div className="text-pink-400 text-[10px] md:text-sm py-2 md:py-6 font-medium text-center leading-tight">
                          Arraste<br/>aqui
                      </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Base Stand */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center pointer-events-none">
         {/* The Pillar - Dynamic Height */}
         {/* Matches new top-[25%] mobile pivot */}
         <div className="w-2 md:w-4 bg-slate-700 rounded-t-full absolute bottom-8 md:bottom-12 h-[76vh] md:h-[68vh]"></div>
         
         {/* The Floor Base */}
         <div className="relative z-10 w-28 md:w-48 h-6 md:h-12 bg-slate-800 rounded-t-full shadow-lg"></div>
         <div className="relative z-0 w-40 md:w-64 h-4 bg-slate-900/20 rounded-[100%] blur-md -mt-2"></div>
      </div>
    </div>
  );
};