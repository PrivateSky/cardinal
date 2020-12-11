import { Component, Prop, State, Element, Listen, Method, h } from "@stencil/core";
import { RouterHistory } from "@stencil/router";

import CustomTheme from "../../decorators/CustomTheme";
import { TableOfContentProperty } from "../../decorators/TableOfContentProperty";
import ControllerRegistryService from "../../services/ControllerRegistryService";

@Component({
  tag: 'psk-mobile',
  styleUrls: {
    default: './styles/psk-mobile.default.css',
    layout: './styles/psk-mobile.layout.css',
    demo: './styles/psk-mobile.demo.css'
  },
  shadow: true
})

export class PskMobile {
  @CustomTheme()

  @Element() private __host: HTMLElement;

  @TableOfContentProperty({
    description: `This property is used as title for the page.`,
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() title: string = '';

  @TableOfContentProperty({
    description: `This property decides if header is rendered (header includes sidebar, options and title).`,
    isMandatory: false,
    propertyType: `boolean`,
    defaultValue: `false`
  })
  @Prop() disableHeader: boolean = false;

  @TableOfContentProperty({
    description: `This property decides if the hamburger button and the sidebar attached with it should be rendered.`,
    isMandatory: false,
    propertyType: `boolean`,
    defaultValue: `false`
  })
  @Prop() disableSidebar: boolean = false;

  @TableOfContentProperty({
    description: `This property decides if the return / go back button should be displayed.`,
    isMandatory: false,
    propertyType: `boolean`,
    defaultValue: `false`
  })
  @Prop() enableBack: boolean = false;

  @TableOfContentProperty({
    description: [
      `This property is a string that will permit the developer to choose his own controller.`,
      `If no value is sent then the null default value will be taken and the component will use the basic Controller.`
    ],
    propertyType: `string`,
    isMandatory: false,
    defaultValue: `null`
  })
  @Prop() controllerName?: string | null;

  @Prop() history: RouterHistory;

  @State() controller: any | null;

  @State() aside = {
    disabled: this.disableSidebar,
    hidden: true
  }

  @State() options = {
    disabled: true,
    hidden: true
  }

  @State() header: {
    disabled: boolean,
    title: string | Element
  } = {
    disabled: this.disableHeader,
    title: this.title
  }

  private __toggleAside(hidden = !this.aside.hidden) {
    this.aside = { ...this.aside, hidden };
    this.options = { ...this.options, hidden: true };
  }

  private __toggleOptions(hidden = !this.options.hidden) {
    this.options = { ...this.options, hidden };
    this.aside = { ...this.aside, hidden: true };
  }

  private __findElementBySlot(slotName) {
    const children = this.__host.children;
    for (let i = 0; i < children.length; i++) {
      if (children[i].getAttribute('slot') === slotName) return children[i];
    }
    return null;
  }

  private static disablePullDownToRefresh() {
    if (document && document.body) {
      document.body.style['overscroll-behavior-y'] = 'contain';
    }
  }

  @Listen('click')
  onClickEvent(e) {
    e.preventDefault();
    e.stopImmediatePropagation();

    const tree: Array<EventTarget> = e.composedPath();
    const main = this.__host.shadowRoot.querySelector('main');

    for (const elem of tree) {
      if (elem === main) {
        this.aside = { ...this.aside, hidden: true };
        this.options = { ...this.options, hidden: true };
      }
    }
  }

  // @Listen('psk-mobile:toggle-options', { target: 'document' })
  // onHandleToggleOptionsEvent(e) {
  //   this.__toggleOptions((typeof e.detail === 'boolean' ? !e.detail : !this.options.hidden));
  // }
  //
  // @Listen('psk-mobile:toggle-sidebar', { target: 'document' })
  // onHandleToggleSidebarEvent(e) {
  //   this.__toggleAside((typeof e.detail === 'boolean' ? !e.detail : !this.aside.hidden));
  // }

  @Method()
  async toggleSidebar(visible) {
    this.__toggleAside((typeof visible === 'boolean' ? !visible : !this.aside.hidden));
  }

  @Method()
  async toggleOptions(visible) {
    this.__toggleOptions((typeof visible === 'boolean' ? !visible : !this.options.hidden));
  }

  async componentWillLoad() {
    PskMobile.disablePullDownToRefresh();

    const options = this.__findElementBySlot('options');
    if (options) {
      this.options.disabled = false;
      for (let i = 0; i < options.children.length; i++) {
        options.children[i].classList.add('option-item');
      }
    }

    const footer = this.__findElementBySlot('footer');
    if (footer) {
      for (let i = 0; i < footer.children.length; i++) {
        footer.children[i].classList.add('footer-item');
      }
    }

    if (this.__findElementBySlot('title')) {
      this.header = {
        ...this.header,
        title: <slot name='title'/>
      };
    }

    if (typeof this.controllerName === "string") {
      try {
        const Controller = await ControllerRegistryService.getController(this.controllerName);
        this.controller = new Controller(this.__host, this.history);
      } catch (err) {
        console.error(err);
      }
    }
  }

  handleAsideClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.__toggleAside();
  }

  handleBackClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    window.history.back();
  }

  handleOptionsClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.__toggleOptions();
  }

  render() {
    return (
      <div class='mobile'>
        {
          !this.header.disabled ? (
            <header>
              <div class='back-toggler'>
                {
                  this.enableBack ? (
                    <psk-button onClick={e => this.handleBackClick(e)}>
                      <psk-icon icon='chevron-left'/>
                    </psk-button>
                  ) : null
                }
              </div>
              <div class='aside-toggler'>
                {
                  !this.aside.disabled ? (
                    <psk-button onClick={e => this.handleAsideClick(e)}>
                      <psk-icon icon='bars'/>
                    </psk-button>
                  ) : null
                }
              </div>
              <h1 class='title'>{this.header.title}</h1>
              <div class='options-toggler'>
                {
                  !this.options.disabled ? (
                    <psk-button onClick={e => this.handleOptionsClick(e)}>
                      <psk-icon icon='ellipsis-v'/>
                    </psk-button>
                  ) : null
                }
              </div>
              <div class='aside-menu' hidden={this.aside.hidden}>
                <psk-user-profile/>
                <psk-app-menu hamburger-max-width={0} item-renderer='sidebar-renderer'/>
              </div>
              <div class='options-menu' hidden={this.options.hidden}>
                <slot name='options'/>
              </div>
            </header>
          ) : null
        }
        <main>
          <div class='main-cover' hidden={this.aside.hidden}/>
          <slot/>
        </main>
        <footer>
          <slot name='footer'/>
        </footer>
      </div>
    )
  }
}
