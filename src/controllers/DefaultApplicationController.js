import AppConfigurationHelper from "./AppConfigurationHelper.js";
import defaultApplicationConfig from "./defaultApplicationConfig.json";
import fetch from "../utils/fetch.js";

let configUrl = "config.json";
let menuUrl = "menu.json";
window.globalConfig = {};
export default class DefaultApplicationController  {

  constructor(element) {
    this.configIsLoaded = false;
    this.pendingRequests = [];
    let basePath;

    if (window && window.location && window.location.origin) {
      basePath = window.location.origin;
    }

    let baseElement = document.querySelector("base");
    if(baseElement){
      let appDir = baseElement.getAttribute("href");
      if (appDir) {
        basePath += appDir;
      }
    }
    if (!basePath.endsWith("/")) {
      basePath += "/";
    }
    configUrl = basePath + configUrl;
    menuUrl = basePath + menuUrl;
    window.basePath = basePath;
    this._getAppConfiguration(configUrl, (err, _configuration) => {

      if (err) {
        return console.log(err);
      }

      this._fetchConfigurationFile(menuUrl, (err, menuConfig) => {

        if(err){
          console.log(err);
        }
        else{
          _configuration.menu = menuConfig;
        }

        this.configuration = AppConfigurationHelper._prepareConfiguration(_configuration, basePath);
        this.configuration.theme = _configuration.theme;
        this.configuration.appVersion = _configuration.appVersion;
        this.configIsLoaded = true;
        while (this.pendingRequests.length) {
          let request = this.pendingRequests.pop();
          this.respondWithConfiguration(request.configName, request.callback)
        }
      });
    })

    element.addEventListener("getThemeConfig", this._provideConfig("theme"));
    element.addEventListener("getAppVersion", this._provideConfig("appVersion"));
    element.addEventListener("needRoutes", this._provideConfig("routes"));
    element.addEventListener("needMenuItems", this._provideConfig("menu"));
    element.addEventListener("getUserInfo", this._provideConfig("profile"));
    element.addEventListener("getHistoryType", this._provideConfig("historyType"));
    element.addEventListener("getModals", this._provideConfig("modals"));
    element.addEventListener("getTags", this._provideConfig("tags"));
    element.addEventListener("getConfiguration", this._provideConfig());
    element.addEventListener("validateUrl", (e) => {
      e.stopImmediatePropagation();
      let { sourceUrl, callback } = e.detail;
      if (callback && typeof callback === "function") {
        this._parseSourceUrl(sourceUrl, callback);
      } else {
        console.error("Callback was not properly provided!");
      }
    });


    //this should be added in a SSApp lifecycle mechanism
    element.addEventListener("getCustomLandingPage",(e)=>{

      let callback = e.detail;
      if (window.frameElement) {
        if(window.frameElement.hasAttribute("landing-page")){
          let landingPage = window.frameElement.getAttribute("landing-page");
          return callback(undefined, landingPage);
        }
      }
      callback();
    });

  }

  _provideConfig(configName) {
    return (e) => {
      e.stopImmediatePropagation();
      let callback = e.detail;

      if (callback && typeof callback === "function") {
        if (this.configIsLoaded) {
          return this.respondWithConfiguration(configName, callback);
        } else {
          this.pendingRequests.push({configName: configName, callback: callback});
        }
      }
    }
  }

  respondWithConfiguration(configName, callback) {
    if (typeof configName !== "undefined" && !this.configuration[configName]) {
      throw new Error(`Config ${configName} does not exists`)
    }

    if (typeof configName === "undefined") {
      return callback(undefined, this.configuration);
    }

    callback(undefined, this.configuration[configName]);
  }

  _parseSourceUrl(sourceUrl, callback) {
    sourceUrl = sourceUrl.replace(/(\s+|-)/g, '').toLowerCase();
    let paths = sourceUrl.split("/");

    let root = this.configuration.pagesHierarchy;
    for (let i = 0; i < paths.length; i++) {
      let segment = paths[i];

      const segmentInsideMenu = Object.keys(root).find(function(key) {
        return root[key].path.toLowerCase().indexOf(segment) !== -1;
      });

      let isSegmentInsideMenu = typeof root[segmentInsideMenu] !== 'undefined';

      if (!root[segment] && !isSegmentInsideMenu) {
        callback(`${sourceUrl} is not a valid path in the application!`);
        break;
      }

      let children;
      if(isSegmentInsideMenu) {
        children = root[segmentInsideMenu].children;
      } else {
        children = root[segment].children;
      }

      if (typeof children === 'object' && typeof children.items === 'object' && i !== paths.length) {
        root = children.items;
        continue;
      }

      let linkPath;
      if(isSegmentInsideMenu) {
        linkPath = root[segmentInsideMenu].path;
      } else {
        linkPath = root[segment].path;
      }

      return callback(undefined, linkPath);
    }
  }

  _getAppConfiguration(url, callback) {
    this._fetchConfigurationFile(url, (err, configuration) => {
      if (err) {
        console.log(err);
        //use default configuration
        return callback(undefined, defaultApplicationConfig);
      }

      for (let i in defaultApplicationConfig) {
        if (!configuration.hasOwnProperty(i)) {
          configuration[i] = defaultApplicationConfig[i];
        }
      }
      callback(undefined, configuration)

    });
  }

  _fetchConfigurationFile(url, callback) {
    fetch(url).then(function (response) {
      return response.json();
    }).then(function (data) {
      callback(undefined, data);
    }).catch(function (e) {
      callback(e);
    });
  }
}
