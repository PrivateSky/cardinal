import {Component, Event, EventEmitter, Prop, h, State} from "@stencil/core";
import {MenuItem} from "../../interfaces/MenuItem";
import {TableOfContentProperty} from "../../decorators/TableOfContentProperty";
import {TableOfContentEvent} from "../../decorators/TableOfContentEvent";
import {ExtendedHistoryType} from "../../interfaces/ExtendedHistoryType";
import CustomTheme from "../../decorators/CustomTheme";

declare const $$: any;

function areBaseUrlAndSeedPresent() {
    return window["$$"] && $$.SSAPP_CONTEXT && $$.SSAPP_CONTEXT.BASE_URL && $$.SSAPP_CONTEXT.SEED;
}

@Component({
  tag: "psk-app-router",
  shadow: true
})
export class PskAppRouter {

  @CustomTheme()
  @TableOfContentProperty({
    description: `This parameter holds the datasource for the creation of the application routes. If this property is not provided, the component will emit an event (needMenuItems) in order to fetch this information.`,
    specialNote: `The same configuration file is used in generating the App Menu component`,
    isMandatory: false,
    propertyType: `Array of MenuItem types(MenuItem[])`
  })
  @Prop() routesItems?: MenuItem[] = [];

  @TableOfContentProperty({
    description: `This is the history type that will be passed along to the stencil-router`,
    isMandatory: false,
    propertyType: `string`,
    defaultValue: `browser`
  })
  @Prop() historyType: ExtendedHistoryType;

  @TableOfContentEvent({
    eventName: `needRoutes`,
    controllerInteraction: {
      required: true
    },
    description: `This event gets the data as parameter and it is emitted immediately after the component is loaded in order to create the application routes `
  })
  @Event({
    eventName: 'needRoutes',
    cancelable: true,
    composed: true,
    bubbles: true,
  }) needRoutesEvt: EventEmitter;


  @TableOfContentEvent({
    eventName: `getHistoryType`,
    controllerInteraction: {
      required: true
    },
    description: `This event gets the history type `
  })
  @Event({
    eventName: 'getHistoryType',
    cancelable: true,
    composed: true,
    bubbles: true,
  }) getHistoryType: EventEmitter;


  @TableOfContentEvent({
    eventName: `hasCustomLandingPage`,
    controllerInteraction: {
      required: true
    },
    description: `Check if a custom landing page is requested`
  })
  @Event({
    eventName: 'getCustomLandingPage',
    cancelable: true,
    composed: true,
    bubbles: true,
  }) getCustomLandingPage: EventEmitter;

  @State() notFoundRoute: string = null;

  @State() landingPage: string = "";

  componentWillLoad(): Promise<any> {

    let promise = Promise.resolve();

    promise.then(() => {
      return new Promise((resolve) => {
        this.needRoutesEvt.emit((err, data) => {
          if (err) {
            console.log(err);
          }
          this.routesItems = data;
          resolve();
        });
      })
    });

    promise.then(() => {
      return new Promise((resolve) => {
        this.getHistoryType.emit((err, data) => {
          if (err) {
            console.log(err);
          }
          this.historyType = data;
          resolve();
        });
      })
    });

    promise.then(() => {
      return new Promise((resolve) => {
        this.getCustomLandingPage.emit((err, redirectPath) => {
          if (err) {
            console.log(err);
          }
          if (redirectPath) {
            if (areBaseUrlAndSeedPresent()) {
                // if we have a BASE_URL then we prefix the redirectPath url with BASE_URL
                const baseUrlPathname = new URL($$.SSAPP_CONTEXT.BASE_URL).pathname;
                redirectPath = `${baseUrlPathname}${redirectPath.indexOf("/") === 0 ? redirectPath.substring(1) : redirectPath}`;
              }
            this.landingPage = redirectPath;
          }
          resolve();

        });
      })
    });

    return promise;

  }

  renderItems(items) {
    let routes = [];
    if (typeof items === "object") {
      routes = items.map((item) => {
        if (item.name == "404") {
          this.notFoundRoute = item.path;
        }

        if(item.children){
          if (item.children.type === "event") {
            return <stencil-route url={`${item.path}/:${item.propName}`} exact={true} component={item.component}/>
          }

          return this.renderItems(item.children.items)
        }
        else{
          return <stencil-route url={item.path} component={item.component}
                                componentProps={item.componentProps}/>
        }

      });
    }
    return routes;
  }

  render() {
    let routes = this.renderItems(this.routesItems);

    if (routes.length === 0) {
      return <psk-ui-loader shouldBeRendered={true}/>
    }

    if (!this.notFoundRoute) {
      this.notFoundRoute = this.routesItems[0].path;
    }
    let basePathname = new URL(window['basePath']).pathname;
    if(areBaseUrlAndSeedPresent()) {
        // if we have a BASE_URL then remove this from basePathname
        basePathname = basePathname.replace(new URL($$.SSAPP_CONTEXT.BASE_URL).pathname, "");
    }

    let landingPagePaths = [basePathname];
    if (basePathname.length > 1 && basePathname.endsWith("/")) {
      basePathname = basePathname.substring(0, basePathname.length - 1);
      landingPagePaths.push(basePathname);
    }

    let landingPagesRoutes = landingPagePaths.map((path) => {
      return <stencil-route url={path} exact={true} component="psk-route-redirect"
                            componentProps={{url: this.routesItems[0].path}}/>
    });


    return (
      <div class="app_container">
        <stencil-router historyType={this.historyType === "query" ? "browser" : this.historyType}>

          <stencil-route-switch scrollTopOffset={0}>
            {this.historyType === "query" ?
              [<stencil-route component="query-pages-router" componentProps={{pages: this.routesItems}}/>,
                this.landingPage ?
                  <stencil-router-redirect url={this.landingPage}></stencil-router-redirect>
                  : null] :
              [landingPagesRoutes,
                routes,
                this.landingPage ?
                  <stencil-router-redirect url={this.landingPage}></stencil-router-redirect>
                  :
                  <stencil-route component="psk-page-not-found"
                                 componentProps={{urlDestination: this.notFoundRoute}}/>]}
          </stencil-route-switch>
          {this.landingPage ?
            <stencil-router-redirect url={this.landingPage}></stencil-router-redirect>
            : null}

        </stencil-router>
      </div>)
  }
}
