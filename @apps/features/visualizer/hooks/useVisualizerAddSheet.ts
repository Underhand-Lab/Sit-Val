import { useState, useCallback, useRef } from 'react';

interface VisualizerToolOption {
  type: string;
  name: string;
  Component: React.ComponentType<any>;
  props?: Record<string, any>;
}

interface UseVisualizerAddSheetProps {
  isToolMenuOpen?: boolean;
  setIsToolMenuOpen?: (val: boolean) => void;
  toolOptions?: VisualizerToolOption[];
  onAddTool?: (option: VisualizerToolOption) => void;
  resolveRef: React.MutableRefObject<((value: any) => void) | null>;
}

export const useVisualizerAddSheet = ({
  isToolMenuOpen,
  setIsToolMenuOpen,
  toolOptions,
  onAddTool,
  resolveRef,
}: UseVisualizerAddSheetProps) => {
  const [internalAddSheetOpen, setInternalAddSheetOpen] = useState(false);

  const isAddSheetOpen = isToolMenuOpen !== undefined ? isToolMenuOpen : internalAddSheetOpen;
  const setAddSheetOpen = useCallback((val: boolean) => {
    if (setIsToolMenuOpen) setIsToolMenuOpen(val);
    else setInternalAddSheetOpen(val);
  }, [setIsToolMenuOpen]);

  const handleAddItem = useCallback(() => {
    if (!toolOptions || toolOptions.length === 0 || !onAddTool) {
      return Promise.resolve(undefined);
    }
    setAddSheetOpen(true);
    return new Promise<any>((resolve) => {
      resolveRef.current = resolve;
    });
  }, [toolOptions, onAddTool, setAddSheetOpen, resolveRef]);

  const handleSelectToolOption = useCallback((option: VisualizerToolOption) => {
    setAddSheetOpen(false);
    if (onAddTool) {
      onAddTool(option);
    } else {
      console.warn('[VisualizerList] onAddTool callback is missing, cancelling promise');
      if (resolveRef.current) {
        resolveRef.current(undefined);
        resolveRef.current = null;
      }
    }
  }, [onAddTool, setAddSheetOpen, resolveRef]);

  const handleCloseSheet = useCallback(() => {
    setAddSheetOpen(false);
    if (resolveRef.current) {
      resolveRef.current(undefined);
      resolveRef.current = null;
    }
  }, [setAddSheetOpen, resolveRef]);

  return {
    isAddSheetOpen,
    setAddSheetOpen,
    handleAddItem,
    handleSelectToolOption,
    handleCloseSheet,
  };
};