import { Component, h, Prop, State, Element, Watch } from '@stencil/core';
import { TableOfContentProperty } from '../../decorators/TableOfContentProperty';
import { MatchResults, RouterHistory } from "@stencil/router";
import { BindModel } from "../../decorators/BindModel";
import CustomTheme from "../../decorators/CustomTheme";
import SSAppInstanceRegistry from "./SSAppInstancesRegistry.js";
import NavigatinTrackerService from "./NavigationTrackerService.js";

declare const $$: any;

@Component({
	tag: 'psk-ssapp',
	shadow: false
})
export class PskSelfSovereignApp {

	@BindModel() modelHandler;

	@CustomTheme()

	@TableOfContentProperty({
		isMandatory: true,
		description: [`This property represents the name of the Self Sovereign Application that you want to run.`],
		propertyType: 'string'
	})
	@Prop() appName: string;

	@TableOfContentProperty({
		isMandatory: false,
		description: `This property keeps should have 2 keys: currentDossierPath and fullPath`,
		propertyType: 'string'
	})
	@Prop({
		attribute: "key-ssi"
	}) seed: string = null;

	@TableOfContentProperty({
		isMandatory: true,
		description: `This property represents the direct path that will be passed to the Iframe as the landing-page property.`,
		propertyType: 'string'
	})
	@Prop() landingPath: string;

  @TableOfContentProperty({
    isMandatory: false,
    description: `This property represents the query params of the Iframe.`,
    propertyType: 'string'
  })
  @Prop() params: string;

	@Prop() history: RouterHistory;
	@Prop() match: MatchResults;

	@State() digestKeySsiHex;
	@State() parsedParams;
	@Element() element;

	private eventHandler;
	private componentInitialized = false;

	connectedCallback() {
		navigator.serviceWorker.addEventListener('message', this.__getSWOnMessageHandler());
	}

	disconnectedCallback() {
		navigator.serviceWorker.removeEventListener('message', this.__getSWOnMessageHandler());
	}

	componentShouldUpdate(newValue, oldValue, changedState) {
		if (newValue !== oldValue && (changedState === "digestKeySsiHex" || changedState === "parsedParams")) {
			window.document.removeEventListener(oldValue, this.eventHandler);
			window.document.addEventListener(newValue, this.eventHandler);
			return true;
		}
		return false;
	}

	componentWillLoad(): Promise<any> {
		if (!this.element.isConnected) {
			return;
		}
		return new Promise((resolve) => {
			this.componentInitialized = true;
			this.loadApp(resolve)
		});
	}

	componentDidLoad() {
		let iframe = this.element.querySelector("iframe");
		console.log("#### Trying to register ssapp reference");
		SSAppInstanceRegistry.getInstance().addSSAppReference(this.appName, iframe);

		this.eventHandler = this.__ssappEventHandler.bind(this);
		window.document.addEventListener(this.digestKeySsiHex, this.eventHandler);
		window.document.addEventListener(this.parsedParams, this.eventHandler);
		NavigatinTrackerService.getInstance().listenForSSAppHistoryChanges();
	}

	@Watch("seed")
	@Watch("params")
	@Watch("match")
  @Watch("landingPath")
	loadApp(callback?) {
		if (this.__hasRelevantMatchParams()) {
			this.seed = this.match.params.keySSI;
		}

		if (this.componentInitialized) {
			this.digestKeySsiHex = this.__digestMessage(this.seed);
			NavigatinTrackerService.getInstance().setIdentity(this.digestKeySsiHex);
			if (typeof callback === "function") {
				callback();
			}

			if (this.params != null && this.params != undefined) {
			  try{
          this.parsedParams = JSON.parse(this.params);
        }catch (e) {
          console.log("Attribute called 'params' could not be parsed.")
        }
      }
		}
	};

	render() {
		let basePath;
		let parentWindow = window.parent;
		let currentWindow = window;

		try {
			while (currentWindow !== parentWindow) {
				basePath = parentWindow.location.origin+parentWindow.location.pathname;
				// @ts-ignore
				currentWindow = parentWindow;
				parentWindow = parentWindow.parent;
			}

		}
		catch (e) { }
		finally {
			basePath = currentWindow.location.origin+currentWindow.location.pathname;
			if (basePath[basePath.length - 1] !== '/') {
				basePath += '/';
      }
      
			let queryParams = "?";
			if (this.parsedParams) {
        queryParams += Object.keys(this.parsedParams)
          .map((key) => key + "=" + this.parsedParams[key])
          .join('&');
      }

            // we are in a context in which SW are not enabled so the iframe must be identified by the seed
            const iframeKeySsi = $$.SSAPP_CONTEXT && $$.SSAPP_CONTEXT.BASE_URL && $$.SSAPP_CONTEXT.SEED ? this.seed : this.digestKeySsiHex;

			const iframeSrc = basePath + "iframe/" + iframeKeySsi + (queryParams.length > 1 ? queryParams : "");
			return (
				<iframe
					landing-page={this.landingPath}
					frameborder="0"
					style={{
						overflow: "hidden",
						height: "100%",
						width: "100%"
					}}
					src={iframeSrc} />
			)
		}

	}


  ___sendLoadingProgress(progress?: any, status?: any) {
    let currentWindow: any = window;
    let parentWindow: any = currentWindow.parent;

    while (currentWindow !== parentWindow) {
        currentWindow = parentWindow;
        parentWindow = currentWindow.parent;
    }

    parentWindow.document.dispatchEvent(new CustomEvent('ssapp:loading:progress', {
        detail: {
            progress,
            status
        }
    }));
  }

	__onServiceWorkerMessageHandler: (e) => void;

	__hasRelevantMatchParams() {
		return this.match && this.match.params && this.match.params.keySSI;
	}

	__ssappEventHandler(e) {
		const data = e.detail || {};
		let iframe = this.element.querySelector("iframe");

		if (data.query === 'seed') {
			iframe.contentWindow.document.dispatchEvent(new CustomEvent(this.digestKeySsiHex, {
				detail: {
					seed: this.seed
				}
			}));
			return;
		}

		if (data.status === 'completed') {
      const signalFinishLoading = () => {
        this.___sendLoadingProgress(100);
        iframe.removeEventListener('load', signalFinishLoading);
      };

      iframe.addEventListener('load', signalFinishLoading);
      iframe.contentWindow.location.reload();
		}
	}

	__getSWOnMessageHandler() {
		if (this.__onServiceWorkerMessageHandler) {
			return this.__onServiceWorkerMessageHandler;
		}

		/**
		 * Listen for seed requests
		 */
		this.__onServiceWorkerMessageHandler = (e) => {
			if (!e.data || e.data.query !== 'seed') {
				return;
			}

			const swWorkerIdentity = e.data.identity;
			if (swWorkerIdentity === this.digestKeySsiHex) {
				e.source.postMessage({
					seed: this.seed
				});
			}
		};
		return this.__onServiceWorkerMessageHandler;
	}

	__digestMessage(message) {
		// @ts-ignore
		const crypto = require("opendsu").loadApi("crypto");
		const hash = crypto.sha256(message);
		return hash;
	}
}
