import { ComponentInterface, getElement } from "@stencil/core";
import { applyStyles } from "../../utils/utilFunctions";

window.cardinal = window.cardinal || {};
window.cardinal.customTheme = window.cardinal.customTheme || {
  THEME: undefined,
  IMPORTS: {},
  // DEPENDENCIES: {},
  EVENTS: {
    GET_THEME: "getThemeConfig",
  }
};
const GLOBALS = window.cardinal.customTheme;

type CustomThemeInterface = (
  target: ComponentInterface,
  methodName: string
) => void;

async function getDependency(url: string) {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (err) {
    console.log(err);
  }
}

async function getTheme(host: HTMLElement, asyncCallback: (host: HTMLElement) => Promise<any>)  {
  host.dispatchEvent(new CustomEvent(GLOBALS.EVENTS.GET_THEME, {
    bubbles: true, cancelable: true, composed: true,
    detail: async (err, theme) => {
      if (err) {
        console.log(err);
        return;
      }
      GLOBALS.THEME = theme;
      (await asyncCallback)(host);
    }
  }));
}

async function injectTheme(host: HTMLElement) {
  const componentName = host.tagName.toLowerCase();
  const componentMode = (host as any).mode || host.getAttribute('mode') || 'default';

  const file = componentName + (componentMode !== 'default' ? `.${componentMode}` : '') + '.css';
  const path = `${(window as any).basePath}themes/${GLOBALS.THEME}/components/${componentName}/${file}`;

  if (!GLOBALS.IMPORTS[path]) {
    GLOBALS.IMPORTS[path] = await getDependency(path);
  }

  const styles = GLOBALS.IMPORTS[path];
  const element = host.shadowRoot ? host.shadowRoot : host;

  applyStyles(element, styles);
}


export default function CustomThemeNew(): CustomThemeInterface {
  return (proto: ComponentInterface) => {
    const { componentWillLoad } = proto;

    proto.componentWillLoad = async function() {
      const host = getElement(this);

      if (host || host.isConnected) {
        if (!GLOBALS.THEME) {
          await getTheme(host, injectTheme);
        } else {
          await injectTheme(host);
        }
      }

      return componentWillLoad && componentWillLoad.call(this);
    }
  }
}
