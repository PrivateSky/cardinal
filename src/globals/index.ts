import { setMode } from '@stencil/core';

declare global {
  interface Window {
    cardinal: {
      path?: string;
      oldCustomTheme?: any;
      customTheme?: any;
      controllers?: any;
      pendingControllerRequests?: any;
    };
  }
}

export default () => setMode(element => {
  return (element as any).mode || element.getAttribute('mode') || 'default';
});
