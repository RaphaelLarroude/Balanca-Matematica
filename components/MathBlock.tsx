
import React from 'react';
import { BlockData, ZoneId } from '../types';
import { GripVertical, X, Calculator, AlertCircle } from 'lucide-react';

interface MathBlockProps {
  block: BlockData;
  zone: ZoneId;
  onDelete?: (id: string) => void;
}

const formatExpression = (expr: string) => {
  let formatted = expr;

  // Visual Replacements Map
  // 1. Convert simple superscript logic for root indices
  const superscripts: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'x': 'ˣ', 'y': 'ʸ', 'n': 'ⁿ', '-': '⁻'
  };
  const toSuper = (str: string) => str.split('').map(c => superscripts[c] || c).join('');

  const subscripts: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    'x': 'ₓ', 'y': 'ᵧ', 'n': 'ₙ'
  };
  const toSub = (str: string) => str.split('').map(c => subscripts[c] || c).join('');

  // root(val, index) -> index√val
  formatted = formatted.replace(/root\(([^,]+),\s*([^)]+)\)/g, (match, val, index) => {
     // If index is simple enough to look good as superscript
     if (/^[0-9xyn-]+$/i.test(index.trim())) {
        return `${toSuper(index.trim())}√${val}`;
     }
     return `${index}√${val}`; // Fallback
  });

  // log(val, base) -> log_base(val)
  formatted = formatted.replace(/log\(([^,]+),\s*([^)]+)\)/g, (match, val, base) => {
     if (/^[0-9xyn]+$/i.test(base.trim())) {
        return `log${toSub(base.trim())}(${val})`;
     }
     return `log${base}(${val})`;
  });

  // Basic math symbols
  formatted = formatted.replace(/\*/g, '×');
  formatted = formatted.replace(/\//g, '÷');
  formatted = formatted.replace(/sqrt\(([^)]+)\)/g, '√$1');
  formatted = formatted.replace(/cbrt\(([^)]+)\)/g, '∛$1');
  
  return formatted;
};

export const MathBlock: React.FC<MathBlockProps> = ({ block, zone, onDelete }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ id: block.id, sourceZone: zone }));
    e.dataTransfer.effectAllowed = 'move';
    try {
        e.dataTransfer.setData('text/plain', block.id); 
    } catch(e) {}
  };

  const isValid = !isNaN(block.value);
  const isEquation = isValid && block.expression !== block.value.toString();
  const isNegative = isValid && block.value < 0;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        relative group flex items-center justify-between
        border 
        rounded-lg md:rounded-xl 
        p-1.5 md:p-3 
        min-w-[85px] md:min-w-[110px] 
        cursor-grab active:cursor-grabbing select-none no-select
        hover:-translate-y-1 hover:shadow-lg
        active:translate-y-0 active:shadow-sm
        touch-manipulation
        transition-all duration-200
        ${zone !== 'bench' ? 'mb-1 md:mb-2 w-full shadow-sm' : 'mr-2 md:mr-3 shadow-[0_4px_0_rgba(0,0,0,0.05)]'}
        ${isValid 
          ? 'bg-white border-white/50' 
          : 'bg-amber-50 border-amber-200'
        }
      `}
    >
      {/* Indicator Bar */}
      <div className={`
        absolute left-0 top-2 bottom-2 md:top-3 md:bottom-3 w-1 rounded-r-full 
        ${!isValid ? 'bg-amber-400' : (isNegative ? 'bg-rose-400' : 'bg-emerald-400')}
      `}></div>

      <div className="flex items-center gap-1.5 md:gap-3 pl-1.5 md:pl-2 overflow-hidden">
        {/* Icon */}
        <div className={`
          flex-shrink-0 p-1 md:p-1.5 rounded-lg transition-colors
          ${isValid ? 'bg-gray-50 text-gray-400 group-hover:text-indigo-500' : 'bg-amber-100 text-amber-500'}
        `}>
            {!isValid ? <AlertCircle size={12} className="md:w-[14px] md:h-[14px]" /> :
             isEquation ? <Calculator size={12} className="md:w-[14px] md:h-[14px]" /> : 
             <GripVertical size={12} className="md:w-[14px] md:h-[14px]" />
            }
        </div>
        
        {/* Content */}
        <div className="flex flex-col leading-tight overflow-hidden">
          <span className="text-sm md:text-lg font-bold text-slate-700 tracking-tight truncate max-w-[100px] md:max-w-[120px]" title={block.expression}>
            {formatExpression(block.expression)}
          </span>
          <span className={`text-[9px] md:text-[10px] font-semibold uppercase tracking-wide ${isValid ? 'text-slate-400' : 'text-amber-500'}`}>
             {isValid ? (isEquation ? `= ${Number(block.value.toFixed(2))}` : 'Valor') : 'Defina Variável'}
          </span>
        </div>
      </div>
      
      {onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          className="ml-1 md:ml-2 w-7 h-7 md:w-6 md:h-6 flex-shrink-0 flex items-center justify-center rounded-full text-slate-300 active:bg-rose-100 active:text-rose-500 hover:bg-rose-100 hover:text-rose-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all md:scale-75 md:group-hover:scale-100"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
