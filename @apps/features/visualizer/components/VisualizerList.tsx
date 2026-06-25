import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Div, BottomSheet, vars } from '@shared/bridges/UIBridge';
import { GenericPanelLayout, SerializedPanelLayout, GenericPanelLayoutHandle, PanelLayout } from '@packages/panel-layout/components/GenericPanelLayout';
import { useVisualizerAddSheet } from '../hooks/useVisualizerAddSheet';
import { useVisualizerToolsAndLayout } from '../hooks/useVisualizerToolsAndLayout';
 
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
  const resolveRef = useRef<((value: any) => void) | null>(null);
  const layoutRef = useRef<GenericPanelLayoutHandle<any>>(null);
  
  const {
    isAddSheetOpen,
    handleAddItem,
    handleSelectToolOption,
    handleCloseSheet,
  } = useVisualizerAddSheet({
    isToolMenuOpen,
    setIsToolMenuOpen,
    toolOptions,
    onAddTool,
    resolveRef,
  });

  const {
    initialLayout,
    reconciledTools,
    isLayoutReady,
    setIsLayoutReady,
    handleLayoutChange,
    layoutToInject,
  } = useVisualizerToolsAndLayout({
    tools,
    toolOptions,
    storageKey,
    onLayoutChange,
    onToolsSync,
    resolveRef,
  });

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