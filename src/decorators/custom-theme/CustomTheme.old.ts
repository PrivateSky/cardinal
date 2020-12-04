import {getElement, ComponentInterface} from "@stencil/core";
import fetch from "../../utils/fetch.js";

const SLOTTED = "SLOTTED:";
declare type CustomThemeInterface = (
  target: ComponentInterface,
  methodName: string
) => void;

window.cardinal = window.cardinal || {};
window.cardinal.oldCustomTheme = window.cardinal.oldCustomTheme || {};

const { oldCustomTheme } = window.cardinal;
oldCustomTheme.dependencies =  oldCustomTheme.dependencies || {};
oldCustomTheme.imports =  oldCustomTheme.imports || {};
oldCustomTheme.appTheme =  oldCustomTheme.appTheme || null;

const { dependencies, imports } = oldCustomTheme;

const regex = /@import.*?["']([^"']+)["'].*?;/g

function checkForInnerDependencies(referrer, styleStr) {

  if (!imports[referrer]) {
    imports[referrer] = new Promise((resolve, reject) => {

      if (regex.exec(styleStr)) {
        styleStr.replace(regex, (match, depUrl) => {

          if (!dependencies[depUrl]) {
            dependencies[depUrl] = resolveDependency(depUrl);
          }

          dependencies[depUrl].then((content) => {
            resolve(styleStr.replace(match, content));
          }).catch(reject)
        });
      }

      else {
        resolve(styleStr);
      }
    })
  }

  return imports[referrer];

}

function resolveDependency(url) {
  return new Promise((resolve, reject) => {
    fetch(url).then((response) => {
      if (response.ok) {
        return resolve(response.text());
      }
      reject({url: response.url, status: response.status, statusText: response.statusText});
    })
  })
}

function isFromSlot (child, element) {

  if(!element){
    return false;
  }

  if(element.shadowRoot){
    return child.parentNode === element.shadowRoot.host;

  }
  return isFromSlot(element, element.parentElement);
}

export default function CustomTheme(): CustomThemeInterface {


  let handleStyleExistenceCheck=(element)=>{
    let childComponents = {};
    element.addEventListener("styleExists",(event:CustomEvent)=>{
      event.stopImmediatePropagation();
      event.preventDefault();

      let eventCallback = event.detail.callback;
      let componentName = event.detail.componentTag;

      eventCallback(undefined, childComponents.hasOwnProperty(componentName), element);
      if (!childComponents[componentName]) {
        childComponents[componentName] = true;
      }
    })


    element.addEventListener("componentWasRemoved",(event:CustomEvent)=>{
      let componentName = event.detail.componentTag;
      if (childComponents[componentName]) {
        delete childComponents[componentName];
      }
    })
  }

  handleStyleExistenceCheck(document.querySelector("body"));


  return (proto: ComponentInterface) => {

    const {componentWillLoad, disconnectedCallback} = proto;
    proto.componentWillLoad = function () {
      const host = getElement(this);
      if (!host) {
        return componentWillLoad && componentWillLoad.call(this);
      }
      else {

        let injectThemeStyle = (theme) => {
          let componentName = host.tagName.toLowerCase();

          let addStyleElement = (parent)=>{
            return new Promise((resolve) => {
              // @ts-ignore
              let themeStylePath = window.basePath + "themes/" + theme + "/components/" + componentName + "/" + componentName + ".css";

              if (!dependencies[themeStylePath]) {
                dependencies[themeStylePath] = new Promise((resolve, reject) => {
                  resolveDependency(themeStylePath).then((cssRaw) => {
                    resolve(cssRaw)
                  }).catch(reject);
                })
              }

              dependencies[themeStylePath].then((cssRaw) => {
                checkForInnerDependencies(themeStylePath, cssRaw).then((data: string) => {
                  let styleElement = document.createElement("style");
                  styleElement.innerHTML = data;
                  parent.append(styleElement);
                })
              }).catch((errorStatus) => {
                console.log(`Request on resource ${errorStatus.url} ended with status: ${errorStatus.status} (${errorStatus.statusText})`);
              }).finally(() => {
                resolve(componentWillLoad && componentWillLoad.call(this));
              })

            })
          }

          if(host.shadowRoot){
            handleStyleExistenceCheck(host);
            return addStyleElement(host.shadowRoot);
          }


          if(!host.isConnected){
            return new Promise(resolve=>{
              resolve(componentWillLoad && componentWillLoad.call(this));
            })
          }

          return new Promise((resolve => {

            let isSlotted = isFromSlot(host, host.parentElement);
            host['isSlotted'] = isSlotted;

            let styleExistsEvent = new CustomEvent("styleExists",
              {
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: {
                  callback: (err, styleExists, shadowRootHostComponent) => {
                    if (err) {
                      console.log(err);
                      return;
                    }

                    if (!styleExists) {
                      if (!isSlotted) {
                        shadowRootHostComponent = shadowRootHostComponent.shadowRoot;
                      }

                      addStyleElement(shadowRootHostComponent).then(() => {
                        resolve();
                      });
                    }else{
                      resolve(componentWillLoad && componentWillLoad.call(this));
                    }
                  },
                  componentTag: isSlotted ? SLOTTED + componentName : componentName
                }
              })

            host.dispatchEvent(styleExistsEvent);
          }))
        };

        if (!oldCustomTheme.appTheme) {
          return new Promise((resolve)=>{
            let event = new CustomEvent("getThemeConfig", {
              bubbles: true,
              cancelable: true,
              composed: true,
              detail: (err, theme) => {
                if (err) {
                  return console.log(err);
                }
                oldCustomTheme.appTheme = theme;
                injectThemeStyle(oldCustomTheme.appTheme).then(()=>{
                  resolve();
                });
              }
            });

            host.dispatchEvent(event);
          });
        }
        else{
          return injectThemeStyle(oldCustomTheme.appTheme);
        }
      }
    };

    proto.disconnectedCallback = function () {
      const host = getElement(this);
      let componentName = host.tagName.toLowerCase();

      if(host['isSlotted']){
        componentName = SLOTTED + componentName;
      }

      let componentWasRemovedEvent = new CustomEvent("componentWasRemoved",
        {
          bubbles: true,
          cancelable: true,
          composed: true,
          detail: {
            componentTag: componentName
          }
        });
      host.dispatchEvent(componentWasRemovedEvent);
      disconnectedCallback && disconnectedCallback.call(this);
    }
  };
}
