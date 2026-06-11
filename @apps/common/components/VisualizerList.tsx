import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Div, BottomSheet, vars } from '@shared/bridges/UIBridge';
import { GenericPanelLayout } from '@packages/panel-layout/components/GenericPanelLayout';

interface VisualizerListProps {
  tools: Array<{ id: string, name: string, Component: React.ComponentType<any>, props?: Record<string, any> }>;
  data: any;
  onRemove: (id: string) => void;
  toolOptions?: Array<{ name: string, Component: React.ComponentType<any>, props?: Record<string, any> }>;
  onAddTool?: (option: { name: string, Component: React.ComponentType<any>, props?: Record<string, any> }) => void;
}

export const VisualizerList: React.FC<VisualizerListProps> = ({
  tools = [],
  data,
  onRemove,
  toolOptions,
  onAddTool,
}) => {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const resolveRef = useRef<((value: any) => void) | null>(null);
  const prevToolsRef = useRef(tools);

  // tools 배열이 증가할 때(즉, 새로운 도구가 성공적으로 상위 상태에 추가되었을 때)
  // 대기 중인 promise를 해당 도구 오브젝트로 resolve 해줍니다.
  useEffect(() => {
    if (tools.length > prevToolsRef.current.length && resolveRef.current) {
      const prevIds = new Set(prevToolsRef.current.map((t) => t.id));
      const newTool = tools.find((t) => !prevIds.has(t.id));
      if (newTool) {
        resolveRef.current(newTool);
        resolveRef.current = null;
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
  }, [toolOptions, onAddTool]);

  const handleSelectToolOption = useCallback((option: any) => {
    setIsAddSheetOpen(false);
    if (onAddTool) {
      onAddTool(option);
    } else {
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

  const renderItem = useCallback(
    (tool: any) => {
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
            <ActiveComponent data={data} {...(tool.props || {})} />
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

  const renderTabLabel = useCallback((tool: any, isActive: boolean) => {
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

  return (
    <Div
      style={{
        display: 'flex', flexDirection: 'column', flex: 1,
        border: `1px solid ${vars.surface}`, borderRadius: '8px',
        overflow: 'hidden', position: 'relative', height: '100%', boxSizing: 'border-box'
      }}
    >
      <GenericPanelLayout
        items={tools}
        renderItem={renderItem}
        renderTabLabel={renderTabLabel}
        onRemoveItem={onRemove}
        onAddItem={toolOptions && onAddTool ? handleAddItem : undefined}
        emptyPlaceholder={emptyPlaceholder}
      />

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
    </Div>
  );
};