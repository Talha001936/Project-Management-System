//note this file is used to provide somehelper function that components reuse again and again
export const parseId = (id) => {
  if (id === undefined || id === null) return null;
  
  const parsed = parseInt(id);
  if (isNaN(parsed) || parsed < 0) return null;
  
  return parsed;
};


export const parseIds = (ids) => {
  if (!Array.isArray(ids)) return [];
  
  return ids
    .map(id => parseId(id))
    .filter(id => id !== null);
};

export const isValidId = (id) => {
  return parseId(id) !== null;
};


export const compareIds = (id1, id2) => {
  const parsed1 = parseId(id1);
  const parsed2 = parseId(id2);
  
  if (parsed1 === null || parsed2 === null) return false;
  
  return parsed1 === parsed2;
};


export const idToString = (id) => {
  const parsed = parseId(id);
  if (parsed === null) return null;
  return String(parsed);
};


export const idToNumber = (id) => {
  return parseId(id);
};