const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (typeof a !== 'object' || a === null || b === null) return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // So sánh mảng
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  // So sánh object
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!deepEqual(a[key], b[key])) return false;
  }

  return true;
};

export default deepEqual;
