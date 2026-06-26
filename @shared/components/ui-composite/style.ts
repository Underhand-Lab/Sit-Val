type StyleLike = Record<string, any> | null | undefined | false | StyleLike[];

export function flattenStyle<T extends Record<string, any>>(style: StyleLike): T | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    return style.reduce<T | undefined>((acc, item) => {
      const flat = flattenStyle<T>(item);
      if (!flat) return acc;
      return acc ? ({ ...acc, ...flat } as T) : flat;
    }, undefined);
  }
  return style as T;
}
