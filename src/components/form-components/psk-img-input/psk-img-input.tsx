import {h, Component, Prop, Host, Element, Watch, State} from '@stencil/core';
import {BindModel} from '../../../decorators/BindModel';
import {TableOfContentProperty} from '../../../decorators/TableOfContentProperty';
import CustomTheme from '../../../decorators/CustomTheme';
import fetch from "../../../utils/fetch.js";

@Component({
  tag: 'psk-img-input'
})
export class PskImgInput {

  @CustomTheme()

  @BindModel() modelHandler;

  @Element() private element: HTMLElement;

  componentWillLoad(){
    this.srcUpdate(this.src);
  }

  render() {
    return <Host  class={`form-group`}>
      {this.label && <psk-label label={this.label} />}

      <div class="outer-container" onClick={this.__clickHandler.bind(this)}>
      {typeof this.imageSource !== "undefined" && this.imageSource !== null
        ? <div class="display-img-container">
          <img src={this.imageSource} alt={this.alt}/>
          <psk-icon icon="pencil"></psk-icon>
        </div>
        : <psk-label label={this.placeholder}></psk-label>
      }
      </div>
      <input type="file" class="form-control-file form-control-sm" style={{"display": "none"}}
             onChange={this.__fileChangeHandler.bind(this)}/>
    </Host>
  }

  __fileChangeHandler = (event) => {
    let filesArray = Array.from(event.target.files);

    if(filesArray.length === 0){
      return;
    }

    let changeEvent = new Event(this.eventName, {
      bubbles: true,
      composed: true,
      cancelable: true
    });

    let reader = new FileReader();
    reader.onload = (e) => {
      let imageDataUrl = e.target.result;
      fetch(imageDataUrl as string)
        .then(res => res.arrayBuffer())
        .then((imageContent) => {
          changeEvent["data"] = imageContent;
          this.element.dispatchEvent(changeEvent);
        });
      this.src = imageDataUrl;
    };
    reader.readAsDataURL(filesArray[0] as File);
  }

  __clickHandler = (event) => {
    let fileChooser = this.element.querySelector("input");
    fileChooser.dispatchEvent(new MouseEvent("click"));
    event.stopImmediatePropagation();
  };

  @State() imageSource: any | null = null;

  @Watch("src")
  srcUpdate(newValue: string) {
    this.imageSource = newValue;
  }

  @TableOfContentProperty({
    description: [`Represent the src of the image that need to be displayed`],
    isMandatory: false,
    propertyType: 'string'
  })
  @Prop() src?: any | null = null;

  @TableOfContentProperty({
    description: [`Represent the alternative text that will be displayed if the image was not able to be loaded`],
    isMandatory: false,
    propertyType: 'string'
  })
  @Prop() alt?: string | null = null;

  @TableOfContentProperty({
    description: [`Represent the text that will be displayed as placeholder when src attribute is not set`],
    isMandatory: false,
    propertyType: 'string',
    defaultValue: "click here to select source"
  })
  @Prop() placeholder?: string = 'click here to select source';

  @TableOfContentProperty({
    description: [`Represent the text that will be used as label for the input`],
    isMandatory: false,
    propertyType: 'string'
  })
  @Prop() label?: string | null = null;

  @TableOfContentProperty({
    description: [`Represent the event type that will be thrown when user changes the image src`],
    isMandatory: false,
    propertyType: 'string',
    defaultValue: "change"
  })
  @Prop() eventName?: string | null = 'change';
}
