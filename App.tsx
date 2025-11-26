import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Variable, X, Save, Wand2 } from 'lucide-react';
import { BlockData, ZoneId } from './types';
import { evaluateExpression, generateId } from './utils/math';
import { BalanceScale } from './components/BalanceScale';
import { MathBlock } from './components/MathBlock';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState(false);
  
  const [blocks, setBlocks] = useState<{ [key: string]: BlockData }>({});
  const [zones, setZones] = useState<{ [key in ZoneId]: string[] }>({
    bench: [],
    left: [],
    right: [],
  });

  const [variables, setVariables] = useState<Record<string, number>>({});
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');

  useEffect(() => {
    setBlocks(prevBlocks => {
      const updatedBlocks = { ...prevBlocks };
      let hasChanges = false;

      Object.keys(updatedBlocks).forEach(key => {
        const block = updatedBlocks[key];
        const newValue = evaluateExpression(block.expression, variables);
        
        const prevVal = block.value;
        const bothNaN = isNaN(prevVal) && newValue !== null && isNaN(newValue);
        
        if (newValue !== null && !bothNaN && newValue !== prevVal) {
          updatedBlocks[key] = { ...block, value: newValue };
          hasChanges = true;
        }
      });

      return hasChanges ? updatedBlocks : prevBlocks;
    });
  }, [variables]);

  const createBlock = (expr: string) => {
    const val = evaluateExpression(expr, variables);
    
    if (val === null) {
      setInputError(true);
      return;
    }
    
    const newBlock: BlockData = {
      id: generateId(),
      expression: expr,
      value: val,
    };

    setBlocks(prev => ({ ...prev, [newBlock.id]: newBlock }));
    setZones(prev => ({ ...prev, bench: [...prev.bench, newBlock.id] }));
    setInputValue('');
    setInputError(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      createBlock(inputValue);
    }
  };

  const handleDrop = (e: React.DragEvent, targetZone: ZoneId) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      
      const data = JSON.parse(dataStr);
      const blockId = data.id;
      const sourceZone = data.sourceZone as ZoneId;

      if (sourceZone === targetZone) return;

      setZones(prev => {
        const newSourceList = prev[sourceZone].filter(id => id !== blockId);
        const newTargetList = [...prev[targetZone], blockId];
        return { ...prev, [sourceZone]: newSourceList, [targetZone]: newTargetList };
      });
    } catch (err) {
      console.error("Drop failed", err);
    }
  };

  const deleteBlock = (id: string) => {
    setBlocks(prev => {
      const newBlocks = { ...prev };
      delete newBlocks[id];
      return newBlocks;
    });
    setZones(prev => ({
      bench: prev.bench.filter(bid => bid !== id),
      left: prev.left.filter(bid => bid !== id),
      right: prev.right.filter(bid => bid !== id),
    }));
  };

  const resetAll = () => {
    if (window.confirm("Tem certeza que deseja limpar tudo?")) {
        setBlocks({});
        setZones({ bench: [], left: [], right: [] });
        setVariables({});
    }
  };

  const saveVariable = () => {
    if (!newVarName.trim() || !newVarValue.trim()) return;
    
    const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!validNameRegex.test(newVarName.trim())) {
        alert("Nome de variável inválido. Use apenas letras e números, começando com letra.");
        return;
    }

    const numValue = parseFloat(newVarValue);
    if (isNaN(numValue)) return;

    setVariables(prev => ({ ...prev, [newVarName.trim()]: numValue }));
    setNewVarName('');
    setNewVarValue('');
  };

  const deleteVariable = (name: string) => {
    setVariables(prev => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  // Algorithm to find the variable value that balances the scale
  const solveForBalance = () => {
    // 1. Find all blocks on the scale
    const scaleBlockIds = [...zones.left, ...zones.right];
    if (scaleBlockIds.length === 0) {
        alert("Coloque blocos na balança primeiro.");
        return;
    }

    // 2. Identify undefined variables used in these blocks
    const usedVars = new Set<string>();
    const varRegex = /[a-zA-Z_][a-zA-Z0-9_]*/g;
    
    scaleBlockIds.forEach(id => {
        const expr = blocks[id].expression;
        const matches = expr.match(varRegex);
        if (matches) {
            matches.forEach(v => usedVars.add(v));
        }
    });

    // Filter out variables that are already defined
    const undefinedVars = Array.from(usedVars).filter(v => variables[v] === undefined);

    if (undefinedVars.length === 0) {
        alert("Não há variáveis desconhecidas para calcular.");
        return;
    }

    if (undefinedVars.length > 1) {
        alert(`Há muitas variáveis desconhecidas (${undefinedVars.join(', ')}). A balança só consegue resolver para uma variável de cada vez.`);
        return;
    }

    const targetVar = undefinedVars[0];

    // 3. Calculate value using linear interpolation (assuming linear expressions)
    // Formula: TotalLeft(x) = TotalRight(x)
    // Since it's linear: (SlopeL * x + InterceptL) = (SlopeR * x + InterceptR)
    // x * (SlopeL - SlopeR) = InterceptR - InterceptL
    // x = (InterceptR - InterceptL) / (SlopeL - SlopeR)

    const calculateTotalWeight = (testValue: number) => {
        const tempVars = { ...variables, [targetVar]: testValue };
        const totalL = zones.left.reduce((sum, id) => {
            const val = evaluateExpression(blocks[id].expression, tempVars);
            return sum + (val === null || isNaN(val) ? 0 : val);
        }, 0);
        const totalR = zones.right.reduce((sum, id) => {
            const val = evaluateExpression(blocks[id].expression, tempVars);
            return sum + (val === null || isNaN(val) ? 0 : val);
        }, 0);
        return { totalL, totalR };
    };

    // Calculate at x = 0 (Intercepts)
    const at0 = calculateTotalWeight(0);
    // Calculate at x = 1 (Slope + Intercept)
    const at1 = calculateTotalWeight(1);

    const slopeL = at1.totalL - at0.totalL;
    const slopeR = at1.totalR - at0.totalR;
    const interceptL = at0.totalL;
    const interceptR = at0.totalR;

    const denominator = slopeL - slopeR;

    if (Math.abs(denominator) < 1e-10) {
        // Slopes are equal. 
        if (Math.abs(interceptL - interceptR) < 1e-10) {
            alert(`A balança já está equilibrada para qualquer valor de ${targetVar}.`);
        } else {
            alert(`Impossível equilibrar. A variável ${targetVar} é cancelada ou a equação não tem solução.`);
        }
        return;
    }

    const result = (interceptR - interceptL) / denominator;
    
    // Round to 2 decimal places for neatness, but keep precision if needed
    const roundedResult = Math.round(result * 100) / 100;

    setVariables(prev => ({ ...prev, [targetVar]: roundedResult }));
  };

  return (
    <div className="h-screen flex flex-col font-sans text-slate-800 overflow-hidden relative">
      
      {/* Mobile Header (Hidden on Desktop) */}
      <header className="flex-none relative w-full z-40 p-2 flex md:hidden justify-between items-start pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/20 backdrop-blur-md rounded-full px-3 py-1">
            <h1 className="text-sm font-bold text-white tracking-tight">
                Balança
            </h1>
        </div>
        <button 
          onClick={resetAll} 
          className="group pointer-events-auto flex items-center justify-center w-8 h-8 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full hover:bg-white/20 transition-all shadow-sm"
        >
          <Trash2 size={14} className="text-rose-300" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col md:flex-row min-h-0 overflow-hidden">
        
        {/* Stage (Balance Scale) - Takes remaining height on mobile */}
        <section className="order-1 md:order-2 flex-1 relative flex flex-col">
            <BalanceScale 
                leftBlocks={zones.left.map(id => blocks[id])}
                rightBlocks={zones.right.map(id => blocks[id])}
                onDropBlock={handleDrop}
                onDeleteBlock={deleteBlock}
            />
        </section>

        {/* Controls & Bench Sidebar / Bottom Sheet */}
        <aside className="order-2 md:order-1 
          w-full md:w-80 lg:w-96 flex-shrink-0 z-30 
          flex flex-col gap-3 md:gap-4 
          p-4 md:p-6 
          bg-white/90 md:bg-white/80 backdrop-blur-xl 
          border-t-0 md:border-r border-white/40 
          rounded-t-3xl md:rounded-none
          shadow-[0_-8px_30px_rgba(0,0,0,0.15)] md:shadow-2xl 
          max-h-[45%] md:max-h-full h-auto md:h-full
        ">
           
           {/* Desktop Header (Visible only on Desktop) */}
           <div className="hidden md:flex flex-none items-center justify-between mb-8">
             <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                Balança <span className="text-indigo-600">Matemática</span>
             </h1>
             <button 
               onClick={resetAll} 
               className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all shadow-sm"
             >
               <Trash2 size={16} className="text-slate-400 group-hover:text-rose-500" />
               <span className="text-sm font-bold">Resetar</span>
             </button>
           </div>

           {/* Scrollable controls area for mobile logic */}
           <div className="flex-none flex flex-row md:flex-col gap-2 md:gap-4 overflow-x-auto md:overflow-x-visible md:overflow-y-auto custom-scrollbar pr-1 pb-1 md:pb-0">
              
              {/* 1. New Block Input */}
              <div className="flex-1 min-w-[200px] md:min-w-0 bg-white rounded-xl md:rounded-2xl p-2.5 md:p-4 shadow-sm border border-indigo-50">
                  <h2 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                    <Plus className="w-3 h-3" /> Novo Bloco
                  </h2>
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={inputValue}
                          onChange={(e) => {
                              setInputValue(e.target.value);
                              setInputError(false);
                          }}
                          onKeyDown={handleKeyPress}
                          placeholder="Ex: 2x, 5"
                          className={`
                            flex-1 pl-3 pr-3 py-2 md:py-2.5 
                            bg-slate-50 rounded-lg border-2 outline-none 
                            font-medium text-indigo-600 text-sm
                            placeholder-indigo-200
                            transition-all duration-200
                            ${inputError 
                                ? 'border-rose-200 bg-rose-50 focus:border-rose-400' 
                                : 'border-slate-100 focus:border-indigo-400 focus:bg-white focus:shadow-lg'
                            }
                          `}
                        />
                        <button 
                          onClick={() => createBlock(inputValue)}
                          disabled={!inputValue.trim()}
                          className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 md:px-4 shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center active:scale-95"
                          title="Criar bloco"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
              </div>

              {/* 2. Variables Section */}
              <div className="flex-1 min-w-[220px] md:min-w-0 bg-white rounded-xl md:rounded-2xl p-2.5 md:p-4 shadow-sm border border-emerald-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <h2 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Variable className="w-3 h-3" /> Variáveis
                    </h2>
                    <button 
                        onClick={solveForBalance}
                        className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full text-[10px] font-bold transition-colors"
                        title="Calcular valor da variável para equilibrar a balança"
                    >
                        <Wand2 className="w-3 h-3" />
                        <span className="hidden sm:inline">Auto-Equilibrar</span>
                    </button>
                  </div>
                  
                  <div className="flex gap-1.5 mb-2">
                    <input 
                      type="text" 
                      placeholder="x"
                      value={newVarName}
                      onChange={(e) => setNewVarName(e.target.value)}
                      className="w-[30%] min-w-0 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-center text-emerald-600 placeholder-emerald-200 focus:border-emerald-400 focus:bg-white outline-none"
                    />
                    <div className="flex items-center text-slate-400 text-xs">=</div>
                    <input 
                      type="text"
                      inputMode="decimal"
                      placeholder="10"
                      value={newVarValue}
                      onChange={(e) => setNewVarValue(e.target.value)}
                      className="flex-1 min-w-0 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center text-emerald-600 placeholder-emerald-200 focus:border-emerald-400 focus:bg-white outline-none"
                    />
                    <button 
                      onClick={saveVariable}
                      disabled={!newVarName || !newVarValue}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Save size={14} />
                    </button>
                  </div>

                  {Object.keys(variables).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-[40px] md:max-h-none overflow-y-auto">
                      {Object.entries(variables).map(([name, val]) => (
                        <div key={name} className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full group">
                          <span className="text-[10px] font-bold text-emerald-700">{name}</span>
                          <span className="text-[10px] text-emerald-600">=</span>
                          <span className="text-[10px] font-bold text-emerald-700 mr-1">{val}</span>
                          <button 
                            onClick={() => deleteVariable(name)}
                            className="w-4 h-4 rounded-full flex items-center justify-center text-emerald-300 hover:bg-emerald-200 hover:text-emerald-700 transition-colors"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
           </div>

           {/* 3. Bench / Inventory */}
           <div className="flex-1 flex flex-col min-h-0 pt-2 border-t border-slate-100">
              <h2 className="flex-none text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Seus Blocos</h2>
              <div 
                className="flex-1 bg-slate-100/50 rounded-xl md:rounded-2xl p-2 md:p-4 border-2 border-dashed border-slate-200 flex flex-wrap content-start gap-2 overflow-y-auto custom-scrollbar transition-colors hover:bg-slate-100 hover:border-indigo-200 min-h-[100px]"
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => handleDrop(e, 'bench')}
              >
                {zones.bench.length === 0 ? (
                   <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2 p-4 text-center">
                      <p className="text-xs italic font-medium">Blocos criados aparecem aqui.</p>
                   </div>
                ) : (
                  zones.bench.map(id => (
                    <MathBlock key={id} block={blocks[id]} zone="bench" onDelete={deleteBlock} />
                  ))
                )}
              </div>
           </div>
        </aside>

      </main>

      {/* Footer */}
      <footer className="flex-none py-2 bg-slate-50 border-t border-slate-100 text-center z-50">
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            © 2025 Raphael Costa. Todos os direitos reservados.
            <span className="hidden md:inline"> • </span>
            <span className="block md:inline">Feito para o site Balança Matemática.</span>
          </p>
      </footer>
    </div>
  );
};

export default App;