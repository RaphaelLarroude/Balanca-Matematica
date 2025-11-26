export const evaluateExpression = (expr: string, variables: Record<string, number> = {}): number | null => {
  if (!expr || !expr.trim()) return null;
  
  let processed = expr.trim();

  // 1. Implicit Multiplication Support
  // Replace "number followed by letter" (e.g., 2x -> 2*x)
  processed = processed.replace(/(\d)([a-zA-Z_])/g, '$1*$2');
  // Replace "number followed by (" (e.g., 2(x) -> 2*(x))
  processed = processed.replace(/(\d)(\()/g, '$1*$2');
  // Replace ") followed by letter or number" (e.g., (a)b -> (a)*b)
  processed = processed.replace(/(\))([a-zA-Z0-9_])/g, '$1*$2');
  // Replace ") followed by (" (e.g., (a)(b) -> (a)*(b))
  processed = processed.replace(/(\))(\()/g, '$1*$2');

  // 2. Validation
  // Allow numbers, basic math operators, parens, and variable names (letters/underscores)
  // Reject anything else to prevent code injection
  if (/[^0-9+\-*/().a-zA-Z_\s]/.test(processed)) {
    return null;
  }

  try {
    // We create a function that takes the variable keys as arguments
    const varNames = Object.keys(variables);
    const varValues = Object.values(variables);

    // We wrap evaluation in a try/catch to handle undefined variables (ReferenceError)
    // If a variable is missing, it will throw ReferenceError -> we return NaN
    // If syntax is invalid, it might throw SyntaxError -> we return null (invalid block)
    const funcBody = `
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