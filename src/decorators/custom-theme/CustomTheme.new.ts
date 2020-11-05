import { ComponentInterface, getElement } from "@stencil/core";
import { applyStyles } from "../../utils/utilFunctions";

window.cardinal = window.cardinal || {};
window.cardinal.customTheme = window.cardinal.customTheme || {
  THEME: undefined,
  IMPORTS: {},
  // DEPENDENCIES: {},
  EVENTS: {
    GET_THEME: "getThemeConfig",
    ADD_STYLE: "CustomTheme:add-style",
    REMOVE_STYLE: "CustomTheme:remove-style"
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
    const style = await response.text();
    return [ true, style ];
  } catch (err) {
    console.log(err);
    return [ false ];
  }
}

async function getTheme(host: HTMLElement, asyncCallback: (host: HTMLElement) => Promise<any>)  {
  host.dispatchEvent(new CustomEvent(GLOBALS.EVENTS.GET_THEME, {
    bubbles: true, cancelable: true, composed: true,
    detail: async (err, theme) => {
      if (err) return console.log(err);
      GLOBALS.THEME = theme;
      await asyncCallback(host);
    }
  }));
}

async function injectTheme(host: HTMLElement) {
  const componentName = host.tagName.toLowerCase();
  const componentMode = (host as any).mode || host.getAttribute('mode') || 'default';

  const file = componentName + (componentMode !== 'default' ? `.${componentMode}` : '') + '.css';
  const path = `${(window as any).basePath}themes/${GLOBALS.THEME}/components/${componentName}/${file}`;

  if (!GLOBALS.IMPORTS[path]) {
    const [ status, style ] = await getDependency(path);
    if (status) GLOBALS.IMPORTS[path] = style;
    else return;
  }

  const styles = GLOBALS.IMPORTS[path];

  if (host.shadowRoot) {
    memorizeStyledElements(host.shadowRoot);
    applyStyles(host.shadowRoot, styles);
    // console.log(host.tagName, path);
  } else {
    host['isSlotted'] = isSlotted(host);
    // host.setAttribute('data-slotted', `${host['isSlotted']}`);
    host.dispatchEvent(new CustomEvent(GLOBALS.EVENTS.ADD_STYLE, {
      bubbles: true, cancelable: true, composed: true,
      detail: {
        data: {
          tag: componentName,
          slotted: host['isSlotted']
        },
        callback: async (err, data) => {
          if (err) return console.log(err);
          const { target } = data;
          applyStyles(target, styles);
          // host.setAttribute('data-root', target.tagName);
        }
      }
    }));
  }
}

function isSlotted(element) {
  while (element.parentElement) {
    if (element.parentElement.shadowRoot) {
      return element.parentElement.shadowRoot.host === element.parentNode;
    }
    element = element.parentElement;
  }
  return false;
}

function memorizeStyledElements(shadowRoot: ShadowRoot) {
  const element = shadowRoot.host;

  const children = {
    true: {}, // slotted children
    false: {} // opposite
  };

  element.addEventListener(GLOBALS.EVENTS.ADD_STYLE, (event: CustomEvent) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const { data: { tag, slotted }, callback } = event.detail;

    if (!children[slotted][tag]) {
      if (slotted) {
        callback(undefined, { target: element });
      } else {
        callback(undefined, { target: shadowRoot });
      }

      children[slotted][tag] = true;
    }
  });

  element.addEventListener(GLOBALS.EVENTS.REMOVE_STYLE, (event: CustomEvent) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const { data: { tag, slotted } } = event.detail;

    children[slotted][tag] = false;
  });
}

export default function CustomTheme_v2(): CustomThemeInterface {
  return (proto: ComponentInterface) => {
    const { componentWillLoad, disconnectedCallback } = proto;

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

    proto.disconnectedCallback = async function() {
      const host = getElement(this);

      host.dispatchEvent(new CustomEvent(GLOBALS.EVENTS.REMOVE_STYLE, {
        bubbles: true, cancelable: true, composed: true,
        detail: {
          data: {
            tag: host.tagName.toLowerCase(),
            slotted: !!host['isSlotted'] // host['isSlotted'] ? true : false
          }
        }
      }));

      return disconnectedCallback && disconnectedCallback.call(this);
    }
  }
}
