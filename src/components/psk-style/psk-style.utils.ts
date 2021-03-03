function applyStyles(host: HTMLElement, styles: string, id: string = null) {
  /** shadow manner **/
  const style = document.createElement('style');
  if (id) style.id = id;
  style.innerHTML = styles;
  host.shadowRoot.appendChild(style);

  /** inline styles **/
  // host.style.setProperty(property, properties[property]);

  /** stylesheet manner **/
  /*
  // StyleSheet, CSSStyleSheet, adoptedStyleSheets
  // 2019, under development

  console.log('before', this.__host.shadowRoot.styleSheets);

  // @ts-ignore
  this.__host.shadowRoot.styleSheets.item(0).insertRule(style);

  console.log('after', this.__host.shadowRoot.styleSheets);
  */
}

function deleteStyle(host: HTMLElement, id: string) {
  const style = host.shadowRoot.querySelector(`#${id}`);
  if (style) style.remove();
}

export { applyStyles, deleteStyle }
