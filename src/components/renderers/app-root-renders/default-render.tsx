import {Component, Event, EventEmitter, h, Prop, State} from "@stencil/core";
import CustomTheme from "../../../decorators/CustomTheme";
import {MOBILE_MAX_WIDTH} from "../../../utils/constants";

@Component({
	tag: 'psk-default-renderer',
	shadow: true
})

export class AppRootDefaultRender {
	@CustomTheme()

	@Prop() mobileLayout: boolean = false;
  @State() appVersion: string;

  @Event({
    eventName: 'getAppVersion',
    cancelable: true,
    composed: true,
    bubbles: true,
  }) getAppVersion: EventEmitter;

	componentWillLoad():Promise<any> {
		return new Promise((resolve)=>{
      this.getAppVersion.emit((err, appVersion) => {
        if (!err) {
          this.appVersion = appVersion;
        }
        resolve();
      });
    })

	}

	render() {

		let appMenuCmpt = <app-menu item-renderer="sidebar-renderer" hamburgerMaxWidth={MOBILE_MAX_WIDTH}></app-menu>;
		let versionCmpt = <div class="nav-footer">version {this.appVersion}</div>;

		let asideComponents = [];

		if (this.mobileLayout) {
			asideComponents = [<psk-user-profile profile-renderer="mobile-profile-renderer"></psk-user-profile>, appMenuCmpt]
		}
		else {
			asideComponents = [<psk-user-profile></psk-user-profile>, appMenuCmpt, versionCmpt]
		}

		return (
			<div class={`global_container ${this.mobileLayout ? "is-mobile" : ""}`}>
				<aside>
					{asideComponents}
				</aside>

				<section>
					<psk-app-router></psk-app-router>
					{this.mobileLayout === true ? versionCmpt : null}
				</section>
			</div>
		);
	}
}
