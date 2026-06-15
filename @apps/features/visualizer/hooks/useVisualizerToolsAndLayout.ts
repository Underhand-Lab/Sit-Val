import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SerializedPanelLayout, PanelLayout } from '@packages/new-panel-layout/components/GenericPanelLayout';

interface VisualizerTool {
  id?: string;
  type: string;
  name: string;
  Component: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface UseVisualizerToolsAndLayoutProps {
  tools: VisualizerTool[];
  toolOptions?: VisualizerTool[];
  storageKey?: string;
  onLayoutChange?: (layout: SerializedPanelLayout) => void;
  onToolsSync?: (tools: VisualizerTool[]) => void;
  resolveRef: React.MutableRefObject<((value: any) => void) | null>;
}

export const useVisualizerToolsAndLayout = ({
  tools,
  toolOptions,
  storageKey,
  onLayoutChange,
  onToolsSync,
  resolveRef,
}: UseVisualizerToolsAndLayoutProps) => {
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const hasInitialSyncedRef = useRef<string | null>(null);
  const prevToolsRef = useRef(tools);

  // 로컬 스토리지 데이터 로드 및 도구(Component) 복구
  const { initialLayout, reconciledTools } = useMemo(() => {
    if (!storageKey) return { initialLayout: undefined, reconciledTools: tools };

    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return { initialLayout: undefined, reconciledTools: tools };
    }

    try {
      const parsed = JSON.parse(saved);

      let savedItems: any[] = [];
      if (parsed.groups) {
        savedItems = parsed.groups.flatMap((col: any) =>
          col.flatMap((row: any) => (row.tabs || []).map((tab: any) => tab.data || tab))
        );
      } else if (parsed.itemsMap) {
        savedItems = Object.values(parsed.itemsMap).map((wrapped: any) => wrapped.data || wrapped);
      } else if (parsed.items) {
        savedItems = parsed.items;
      }

      const restored = savedItems.map(sItem => {
        if (!sItem || typeof sItem !== 'object') return null;
        const option = toolOptions?.find(opt =>
          (sItem.type && opt.type === sItem.type) || (sItem.name && opt.name === sItem.name)
        );
        return option ? { ...sItem, type: option.type, name: option.name, Component: option.Component } : null;
      }).filter((t): t is VisualizerTool => t !== null && t.Component !== undefined);

      return { initialLayout: parsed, reconciledTools: restored.length > 0 ? restored : tools };
    } catch (e) {
      console.error('[VisualizerList][Load] Parsing error:', e);
      return { initialLayout: undefined, reconciledTools: tools };
    }
  }, [storageKey, toolOptions, tools]);

  // 복구된 도구 목록을 부모 상태와 동기화 (저장소 키별로 최초 1회만 수행하여 도구 추가 시 덮어쓰기 방지)
  useEffect(() => {
    if (onToolsSync && storageKey && hasInitialSyncedRef.current !== storageKey) {
      const currentNames = tools.map(t => t.type || t.name).join(',');
      const restoredNames = reconciledTools.map(t => t.type || t.name).join(',');

      if (currentNames !== restoredNames || tools.some((t, i) => t.id !== reconciledTools[i]?.id)) {
        onToolsSync(reconciledTools);
      }
      hasInitialSyncedRef.current = storageKey;
    }
  }, [reconciledTools, onToolsSync, storageKey, tools]);

  // tools 배열이 증가할 때(즉, 새로운 도구가 성공적으로 상위 상태에 추가되었을 때)
  // 대기 중인 promise를 해당 도구 오브젝트로 resolve 해줍니다.
  useEffect(() => {
    if (tools.length > prevToolsRef.current.length) {
      const prevToolIds = new Set(prevToolsRef.current.map(t => t.id));
      const newTool = tools.find((t) => t.id && !prevToolIds.has(t.id));

      if (newTool) {
        if (resolveRef.current) {
          resolveRef.current(newTool);
          resolveRef.current = null;
        }
      }
    }
    prevToolsRef.current = tools;
  }, [tools, resolveRef]);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((layoutJson: PanelLayout<any>) => {
    if (!isLayoutReady) {
      setIsLayoutReady(true);
      return;
    }

    const newLayout: SerializedPanelLayout = {
      groups: layoutJson.groups.map(col => col.map(row => ({
        id: row.id,
        width: row.width,
        height: row.height,
        tabs: row.tabs.map(tab => ({
          id: tab.id,
          type: (tab.data as any).type,
          name: (tab.data as any).name,
          props: (tab.data as any).props
        })) as any
      }))),
      activeTabMap: layoutJson.activeTabMap,
      panelTypes: (initialLayout as any)?.panelTypes || {}
    };

    const hasItems = newLayout.groups && newLayout.groups.some((col: any) => col.some((row: any) => row.tabs && row.tabs.length > 0));
    if (!hasItems) {
      console.warn('[VisualizerList] 비어있는 레이아웃이 전달되어 저장을 취소합니다.');
      return;
    }

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
    }
    onLayoutChange?.(newLayout);
  }, [storageKey, onLayoutChange, isLayoutReady, initialLayout]);

  // 엔진에 주입할 레이아웃 데이터 가공 (타입 호환성 보장)
  const layoutToInject = useMemo(() => {
    if (isLayoutReady || !initialLayout) return undefined;

    return {
      ...initialLayout,
      groups: initialLayout.groups?.map((col: any) => col.map((row: any) => ({
        ...row,
        tabs: row.tabs?.map((t: any) => typeof t === 'string' ? t : (t.id || t))
      })))
    };
  }, [isLayoutReady, initialLayout]);

  return {
    initialLayout,
    reconciledTools,
    isLayoutReady,
    setIsLayoutReady,
    handleLayoutChange,
    layoutToInject,
  };
};