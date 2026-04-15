export function computeSpliceOps(oldStr: string, newStr: string) {
  let prefixLen = 0;
  while (
    prefixLen < oldStr.length &&
    prefixLen < newStr.length &&
    oldStr[prefixLen] === newStr[prefixLen]
  ) {
    prefixLen++;
  }

  let oldSuffix = oldStr.length;
  let newSuffix = newStr.length;
  while (
    oldSuffix > prefixLen &&
    newSuffix > prefixLen &&
    oldStr[oldSuffix - 1] === newStr[newSuffix - 1]
  ) {
    oldSuffix--;
    newSuffix--;
  }

  return {
    index: prefixLen,
    deleteCount: oldSuffix - prefixLen,
    insert: newStr.slice(prefixLen, newSuffix),
  };
}
