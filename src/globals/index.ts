import { setMode } from '@stencil/core';

declare global {
  interface Window {
    cardinal: {
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
