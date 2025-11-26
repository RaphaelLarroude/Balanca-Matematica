
export const evaluateExpression = (expr: string, variables: Record<string, number> = {}): number | null => {
  if (!expr || !expr.trim()) return null;
  
  let processed = expr.trim();

  // 0. Replace special visual symbols with math equivalents
  processed = processed.replace(/²/g, '^2');       // Superscript 2 -> ^2
  processed = processed.replace(/³/g, '^3');       // Superscript 3 -> ^3
  processed = processed.replace(/√/g, 'sqrt(');    // Square root symbol -> sqrt(
  processed = processed.replace(/∛/g, 'cbrt(');    // Cube root symbol -> cbrt(
  processed = processed.replace(/π/g, 'PI');       // Pi symbol -> PI constant
  processed = processed.replace(/pi/gi, 'PI');     // "pi" text -> PI constant

  // 1. Implicit Multiplication Support
  // Replace "number followed by letter" (e.g., 2x -> 2*x)
  processed = processed.replace(/(\d)([a-zA-Z_])/g, '$1*$2');
  // Replace "number followed by (" (e.g., 2(x) -> 2*(x))
  processed = processed.replace(/(\d)(\()/g, '$1*$2');
  // Replace ") followed by letter or number" (e.g., (a)b -> (a)*b)
  processed = processed.replace(/(\))([a-zA-Z0-9_])/g, '$1*$2');
  // Replace ") followed by (" (e.g., (a)(b) -> (a)*(b))
  processed = processed.replace(/(\))(\()/g, '$1*$2');

  // 2. Handle Power Operator
  // JS uses **, but user might type ^. Replace ^ with **
  processed = processed.replace(/\^/g, '**');

  // 3. Validation
  // Allow numbers, basic math operators, parens, and variable names (letters/underscores)
  // Also allow comma for multi-arg functions like max(a,b) or root(a,b)
  // Reject anything else to prevent code injection
  if (/[^0-9+\-*/().,a-zA-Z_\s]/.test(processed)) {
    return null;
  }

  try {
    // We create a function that takes the variable keys as arguments
    const varNames = Object.keys(variables);
    const varValues = Object.values(variables);

    // Inject Math functions into scope so user can type "sqrt(4)" instead of "Math.sqrt(4)"
    const mathFunctions = Object.getOwnPropertyNames(Math).filter(n => n !== 'log'); // Filter out log to override it
    const mathScope = mathFunctions.map(key => `const ${key} = Math.${key};`).join('\n');

    // Define custom functions for roots and logs
    // root(value, index): Nth root. Handles negative odd roots correctly (e.g. cbrt(-8) = -2)
    const customFunctions = `
      const root = (x, n) => {
        if (x < 0) {
            // For odd roots (3, 5, etc), we can handle negative numbers
            if (Math.abs(n % 2) === 1) return -Math.pow(-x, 1/n);
            return NaN; 
        }
        return Math.pow(x, 1/n);
      };
      
      // log(value, base): if base is omitted, assumes base 10 (common school math). 
      // Math.log is ln (base e), so we provide ln as a separate constant/function if needed.
      const log = (x, base) => {
        if (base === undefined) return Math.log10(x);
        return Math.log(x) / Math.log(base);
      };
      
      const ln = Math.log;
    `;

    const funcBody = `
      ${mathScope}
      ${customFunctions}
      try {
        return (${processed});
      } catch (e) {
        return NaN;
      }
    `;

    // eslint-disable-next-line no-new-func
    const func = new Function(...varNames, funcBody);
    const result = func(...varValues);

    // If the result is technically a number but infinite (e.g. divide by zero), treat as valid but Infinity
    // If it is NaN, it means a variable was missing or 0/0 calculation.
    return result;
  } catch (e) {
    return null;
  }
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
