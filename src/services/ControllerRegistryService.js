window.cardinal = window.cardinal || {};
window.cardinal.controllers = window.cardinal.controllers || {};
window.cardinal.pendingControllerRequests =
  window.cardinal.pendingControllerRequests || {};

const { controllers, pendingControllerRequests } = window.cardinal;

const ControllerRegistryService = {
  registerController: (controllerName, controller) => {
    controllers[controllerName] = controller;

    if (pendingControllerRequests[controllerName]) {
      while (pendingControllerRequests[controllerName].length) {
        let request = pendingControllerRequests[controllerName].pop();
        request.resolve(controllers[controllerName]);
      }
    }
  },

  getController: (controllerName) => {
    return new Promise((resolve, reject) => {
      if (controllers[controllerName]) {
        resolve(controllers[controllerName]);
      } else {
        let resourcePath = `scripts/controllers/${controllerName}.js`;
        if (typeof window.basePath !== "undefined") {
          let sep = "/";
          if (window.basePath[window.basePath.length - 1] === sep) {
            sep = "";
          }
          resourcePath = window.basePath + sep + resourcePath;
        }
        import(resourcePath)
          .then((module) => {
            resolve(module.default || module);
          })
          .catch(reject);
      }
    });
  }
}

export default ControllerRegistryService;
