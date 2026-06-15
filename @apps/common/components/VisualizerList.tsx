import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Div, BottomSheet, vars } from '@shared/bridges/UIBridge';
import { GenericPanelLayout, SerializedPanelLayout, GenericPanelLayoutHandle, PanelLayout } from '@packages/new-panel-layout/components/GenericPanelLayout';

interface VisualizerListProps {
  tools: Array<{ id?: string, type: string, name: string, Component: React.ComponentType<any>, props?: Record<string, any> }>;
  data: any;
  toolOptions?: Array<{ type: string, name: string, Component: React.ComponentType<any>, props?: Record<string, any> }>;
  onAddTool?: (option: { type: string, name: string, Component: React.ComponentType<any>, props?: Record<string, any> }) => void;
  storageKey?: string;
  isToolMenuOpen?: boolean;
  setIsToolMenuOpen?: (val: boolean) => void;
  onLayoutChange?: (layout: SerializedPanelLayout) => void;
  onToolsSync?: (tools: VisualizerListProps['tools']) => void;
  commonItemProps?: Record<string, any>;
}

export const VisualizerList: React.FC<VisualizerListProps> = memo(({
  tools,
  data,
  toolOptions,
  onAddTool,
  storageKey,
  isToolMenuOpen,
  setIsToolMenuOpen,
  onLayoutChange,
  onToolsSync,
  commonItemProps,
}) => {
  const [internalAddSheetOpen, setInternalAddSheetOpen] = useState(false);
  const resolveRef = useRef<((value: any) => void) | null>(null);
  const layoutRef = useRef<GenericPanelLayoutHandle<any>>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const hasInitialSyncedRef = useRef<string | null>(null);

  // 부모로부터 제어받는 상태와 내부 상태를 통합합니다.
  const isAddSheetOpen = isToolMenuOpen !== undefined ? isToolMenuOpen : internalAddSheetOpen;
  const setIsAddSheetOpen = useCallback((val: boolean) => {
    if (setIsToolMenuOpen) setIsToolMenuOpen(val);
    else setInternalAddSheetOpen(val);
  }, [setIsToolMenuOpen]);
  
  // 로컬 스토리지 데이터 로드 및 도구(Component) 복구
  const { initialLayout, reconciledTools } = useMemo(() => {
    if (!storageKey) return { initialLayout: undefined, reconciledTools: tools };

    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      console.log(`[VisualizerList][Load] No saved layout found for key: ${storageKey}`);
      return { initialLayout: undefined, reconciledTools: tools };
    }

    try {
      const parsed = JSON.parse(saved);
      console.log('[VisualizerList][Load] Raw parsed groups:', parsed.groups);

      // itemsMap 필드에서 실제 도구 데이터 객체들을 추출합니다.
      // GenericPanelLayout은 itemsMap 내부에 { id, data: T } 형태로 래핑하여 보관합니다.
      let savedItems: any[] = [];
      if (parsed.groups) {
        // groups에서 모든 tabs를 평탄화하여 추출 (getFullLayout의 출력 구조 대응)
        savedItems = parsed.groups.flatMap((col: any) => 
          col.flatMap((row: any) => (row.tabs || []).map((tab: any) => tab.data || tab))
        );
      } else if (parsed.itemsMap) {
        savedItems = Object.values(parsed.itemsMap).map((wrapped: any) => wrapped.data || wrapped);
      } else if (parsed.items) {
        savedItems = parsed.items;
      }

      // JSON 데이터에는 Component(함수)가 없으므로 name을 대조하여 Component 참조를 복구합니다.
      const restored = savedItems.map(sItem => {
        if (!sItem || typeof sItem !== 'object') return null;
        // type으로 먼저 찾고, 없으면 하위 호환성을 위해 name으로 찾습니다.
        const option = toolOptions?.find(opt => 
          (sItem.type && opt.type === sItem.type) || (sItem.name && opt.name === sItem.name)
        );
        return option ? { ...sItem, type: option.type, name: option.name, Component: option.Component } : null;
      }).filter((t): t is any => t !== null && t.Component !== undefined);

      console.log('[VisualizerList][Load] Successfully reconciled tools:', restored.map(t => t.name));
      return { initialLayout: parsed, reconciledTools: restored.length > 0 ? restored : tools };
    } catch (e) {
      console.error('[VisualizerList][Load] Parsing error:', e);
      return { initialLayout: undefined, reconciledTools: tools };
    }
  }, [storageKey, toolOptions]); // tools는 초기값으로만 사용하므로 의존성에서 제외하거나 마운트 시에만 실행

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
  }, [reconciledTools, onToolsSync, storageKey]);

  const prevToolsRef = useRef(tools);

  // tools 배열이 증가할 때(즉, 새로운 도구가 성공적으로 상위 상태에 추가되었을 때)
  // 대기 중인 promise를 해당 도구 오브젝트로 resolve 해줍니다.
  useEffect(() => {
    if (tools.length > prevToolsRef.current.length) {
      const prevSet = new Set(prevToolsRef.current);
      const newTool = tools.find((t) => !prevSet.has(t));
      
      if (newTool) {
        if (resolveRef.current) {
          // 1. 레이아웃 내부의 '+' 버튼으로 추가된 경우
          resolveRef.current(newTool);
          resolveRef.current = null;
        } else {
          // 2. 외부(Page Header 등) 버튼으로 추가된 경우: GenericPanelLayout은 items prop 변경을 통해 자동으로 처리합니다.
        }
      }
    }
    prevToolsRef.current = tools;
  }, [tools]);

  const handleAddItem = useCallback(() => {
    if (!toolOptions || toolOptions.length === 0 || !onAddTool) {
      return Promise.resolve(undefined);
    }
    setIsAddSheetOpen(true);
    return new Promise<any>((resolve) => {
      resolveRef.current = resolve;
    });
  }, [toolOptions, onAddTool, setIsAddSheetOpen]);

  const handleSelectToolOption = useCallback((option: any) => {
    setIsAddSheetOpen(false);
    if (onAddTool) {
      onAddTool(option);
    } else {
      console.warn('[VisualizerList] onAddTool callback is missing, cancelling promise');
      if (resolveRef.current) {
        resolveRef.current(undefined);
        resolveRef.current = null;
      }
    }
  }, [onAddTool]);

  const handleCloseSheet = useCallback(() => {
    setIsAddSheetOpen(false);
    if (resolveRef.current) {
      resolveRef.current(undefined);
      resolveRef.current = null;
    }
  }, []);

  // 레이아웃 변경 핸들러
  const handleLayoutChange = useCallback((layoutJson: PanelLayout<any>) => {
    // 엔진이 로드를 완료하기 전(initialLayout 주입 단계)에 발생하는 초기 이벤트인 경우
    if (!isLayoutReady) {
      console.log('[VisualizerList] 초기 레이아웃 주입 감지: 준비 완료 상태로 전환합니다.');
      setIsLayoutReady(true);
      return;
    }

    console.log('[VisualizerList] handleLayoutChange 실행됨:', layoutJson);

    // PanelLayout<any>를 SerializedPanelLayout으로 변환 (탭 배열을 ID 배열로 변환)
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

    // 비정상적으로 비어있는 레이아웃이 전달될 경우 저장을 방지하여 데이터 오염을 막습니다.
    const hasItems = newLayout.groups && newLayout.groups.some((col: any) => col.some((row: any) => row.tabs && row.tabs.length > 0));
    if (!hasItems) {
      console.warn('[VisualizerList] 비어있는 레이아웃이 전달되어 저장을 취소합니다.');
      return;
    }

    if (storageKey) {
      console.log(`[VisualizerList] 로컬 스토리지 저장 시도 (키: ${storageKey}):`, newLayout);
      // 엔진이 반환한 레이아웃 구조를 그대로 저장합니다.
      localStorage.setItem(storageKey, JSON.stringify(newLayout));
    }
    onLayoutChange?.(newLayout);
  }, [storageKey, onLayoutChange, isLayoutReady, initialLayout]);

  const renderItem = useCallback(
    (tool: any, _id: string, _handlers: any) => {
      const Component = tool.Component;
      if (!Component) return null;

      const type = typeof Component;
      const isReactElement =
        React.isValidElement(Component) ||
        (type === 'object' &&
          Component !== null &&
          (Component as any).$$typeof?.toString().includes('react.element'));

      if (isReactElement) {
        return (
          <Div style={{ width: '100%', height: '100%', overflowY: 'auto', backgroundColor: vars.box, padding: '24px', boxSizing: 'border-box' }}>
            {Component}
          </Div>
        );
      }

      const isComponentType =
        type === 'function' ||
        type === 'string' ||
        (type === 'object' && Component !== null && (Component as any).$$typeof);

      if (isComponentType) {
        const ActiveComponent = Component as React.ComponentType<any>;
        return (
          <Div style={{ width: '100%', height: '100%', overflowY: 'auto', backgroundColor: vars.box, padding: '24px', boxSizing: 'border-box' }}>
            <ActiveComponent data={data} {...(tool.props || {})} {...commonItemProps} />
          </Div>
        );
      }

      return (
        <Div style={{ color: vars.text, textAlign: 'center', padding: '24px' }}>
          오류: 유효하지 않은 분석 도구 컴포넌트 형식입니다.
        </Div>
      );
    },
    [data]
  );

  const renderTabLabel = useCallback((tool: any, isActive: boolean, _id: string) => {
    return (
      <span style={{ fontSize: '14px', color: vars.text, fontWeight: isActive ? 'bold' : 'normal' }}>
        {tool.name}
      </span>
    );
  }, []);

  const emptyPlaceholder = (
    <Div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: vars.text,
        flexDirection: 'column',
        gap: '10px',
        padding: '24px',
      }}
    >
      <p>표시할 분석 도구가 없습니다.</p>
      <p style={{ fontSize: '12px' }}>상단에서 도구를 추가하여 분석을 시작하세요.</p>
    </Div>
  );
  
  // 엔진에 주입할 레이아웃 데이터 가공 (타입 호환성 보장)
  const layoutToInject = useMemo(() => {
    if (isLayoutReady || !initialLayout) return undefined;
    
    // SerializedPanelLayout 형식(tabs가 string[])으로 변환하여 엔진에 주입
    return {
      ...initialLayout,
      groups: initialLayout.groups?.map((col: any) => col.map((row: any) => ({
        ...row,
        tabs: row.tabs?.map((t: any) => typeof t === 'string' ? t : (t.id || t))
      })))
    };
  }, [isLayoutReady, initialLayout]);

  return (
    <>
      <Div
        style={{
          display: 'flex', flexDirection: 'column', flex: 1,
          border: `1px solid ${vars.surface}`, borderRadius: '8px',
          overflow: 'hidden', position: 'relative', height: '100%', boxSizing: 'border-box'
        }}
      >
        <GenericPanelLayout
          ref={layoutRef}
          // 중요: 초기화 전에는 스토리지에서 복구된 도구(ID 일치 보장)를 사용하고,
          // 동기화가 완료되면 부모의 최신 tools 상태를 사용합니다.
          items={isLayoutReady ? tools : reconciledTools}
          renderItem={renderItem}
          renderTabLabel={renderTabLabel}
          onRemoveItem={(tool) => {
            onToolsSync?.(tools.filter(t => t !== tool));
          }}
          onAddItem={toolOptions && onAddTool ? handleAddItem : undefined}
          emptyPlaceholder={emptyPlaceholder}
          // 중요: 이미 초기화가 끝났다면 layout prop을 undefined로 전달하여
          // 엔진이 내부 상태(현재 배치)를 유지하도록 합니다.
          layout={layoutToInject}
          onLayoutChange={handleLayoutChange}
          onLayoutChangeEnd={handleLayoutChange}
        />
      </Div>

      {toolOptions && (
        <BottomSheet
          isOpen={isAddSheetOpen}
          onClose={handleCloseSheet}
          title="분석 도구 추가"
        >
          <Div
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {toolOptions.map((option) => (
              <Div
                key={option.name}
                onClick={() => handleSelectToolOption(option)}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  color: vars.text,
                  backgroundColor: vars.box,
                  border: '1px solid',
                  borderColor: vars.surface,
                  borderRadius: '6px',
                  textAlign: 'center',
                  transition: 'background-color 0.2s',
                }}
              >
                {option.name}
              </Div>
            ))}
          </Div>
        </BottomSheet>
      )}
    </>
  );
});