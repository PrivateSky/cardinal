import { applyStyles, deleteStyle } from '../psk-style/psk-style.utils'

function generateRule(selector: string, properties: { [key: string]: string }) {
  let styles = `${selector} {\n`;
  for (const property in properties) {
    styles += `\t${property}: ${properties[property]};\n`;
  }
  styles += '}';
  return styles;
}

export { applyStyles, deleteStyle, generateRule }
