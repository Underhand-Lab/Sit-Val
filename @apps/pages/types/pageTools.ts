import React from 'react';

export type PageToolComponent = React.ComponentType<any>;

export interface PageToolOption {
  type: string;
  name: string;
  Component: PageToolComponent;
  props?: Record<string, unknown>;
}
