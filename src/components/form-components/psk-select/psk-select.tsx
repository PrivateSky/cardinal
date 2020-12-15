import { Component, Prop, State, Element, h } from '@stencil/core';

import { Option, SelectType } from '../../../interfaces/FormModel';
import CustomTheme from '../../../decorators/CustomTheme';
import { BindModel } from '../../../decorators/BindModel';
import { TableOfContentProperty } from '../../../decorators/TableOfContentProperty';
import PskButtonEvent from "../../../events/PskButtonEvent";
import { normalizeRegexToString } from '../../../utils/utilFunctions';
import { INVALID_ID_CHARACTERS_REGEX } from "../../../utils/constants";

@Component({
  tag: 'psk-select'
})

export class PskSelect {

  @CustomTheme()

  @BindModel() modelHandler;

  @Element() private _host: HTMLElement;

  @State() options: Array<Option> = [];

  @TableOfContentProperty({
    description: [`This property is providing the list of the options available for selection.`,
      `Each option is sepparated by the special character "|" (pipe) (e.g. option 1 | option 2 | option 3).`,
      `For each option, as a recommendation, you should add a value sepparated by comma.`,
      `Example of options with values: "Romania, ROM | Italy, ITA | Germany, DE"`,
      `If no value is provided for an option, the component will create one. It will take the option and will normalize it creating the value. Any character which does not comply to the rule, will be removed.`,
      `The rule is that a label must match the folowing regular exprssion: "A-Za-z0-9_-"., which means that all the characers should be alpha-numeric and only two special characters are allowed (_ and -).`],
    isMandatory: false,
    propertyType: 'string'
  })
  @Prop() selectOptions?: string | null = null;

  @TableOfContentProperty({
    description: [`By filling out this property, the component will display above it, a label using <psk-link page="forms/psk-label">psk-label</psk-link> component.`],
    isMandatory: false,
    propertyType: 'string',
    specialNote: `If this property is not provided, the component will be displayed without any label`
  })
  @Prop() label?: string | null = null;

  @TableOfContentProperty({
    description: [`Specifies the value of a psk-select component.`,
      `This value is updated also in the model using the two-way binding. Information about two-way binding using models and templates can be found at: <psk-link page="forms/using-forms">Using forms</psk-link>.`],
    isMandatory: false,
    propertyType: 'string'
  })
  @Prop() value?: string | null = null;

  @TableOfContentProperty({
    description: [`Specifies the type of the psk-select component.`,
      `There are two possible values, "single" and "multiple". If no value is provided, "single" is assumed.`],
    isMandatory: false,
    propertyType: 'string',
    defaultValue: 'single'
  })
  @Prop() selectionType?: SelectType = 'single';

  @TableOfContentProperty({
    description: [`Specifies a short hint that describes the expected value of an psk-date-input component`],
    isMandatory: false,
    propertyType: 'string'
  })
  @Prop() placeholder?: string | null = null;

  @TableOfContentProperty({
    description: [`Specifies that at least one option must be selected before submitting the form.`,
      `Accepted values: "true" and "false"`],
    isMandatory: false,
    propertyType: 'boolean',
    defaultValue: "false"
  })
  @Prop() required?: boolean = false;

  @TableOfContentProperty({
    description: [`	Specifies that the component is disabled. Most of the times is used within conditional formatting of components.`,
      `Accepted values: "true" and "false"`],
    isMandatory: false,
    propertyType: 'boolean',
    defaultValue: "false"
  })
  @Prop() disabled?: boolean = false;

  @TableOfContentProperty({
    description: [`This property indicates if the value entered by the user is a valid one according to some validation present in the controller.`],
    isMandatory: false,
    propertyType: 'boolean'
  })
  @Prop() invalidValue?: boolean | null = null;

  @TableOfContentProperty({
    description: `By defining this attribute, the component will be able to trigger an event.`,
    isMandatory: false,
    propertyType: 'string'
  })
  @Prop() eventName: string | null;

  @TableOfContentProperty({
    description: ['This attribute is used to pass some information along with an event.',
      'This attribute is taken into consideration only if the eventName has a value. If not, it is ignored.'],
    isMandatory: false,
    propertyType: 'any'
  })
  @Prop() eventData: any | null;

  componentWillLoad() {
    if (this.selectionType !== 'single' && this.selectionType !== 'multiple') {
      this.selectionType = 'single';
    }

    if (this.selectOptions) {
      this.__createOptions();
    }
  }

  __onChangeHandler(evt): void {
    evt.preventDefault();
    evt.stopImmediatePropagation();

    const value = evt.target.value;
    if (this.modelHandler) this.modelHandler.updateModel('value', value);

    if (this.eventName) {
      evt.preventDefault();
      evt.stopImmediatePropagation();

      this._host.dispatchEvent(new PskButtonEvent(this.eventName, {
        value,
        payload: this.eventData
      }, {
        bubbles: true,
        composed: true,
        cancelable: true
      }));
    }
  }

  __createOptions(): void {
    let optionsArray: Array<string> = this.selectOptions.split('|');

    this.options = optionsArray.map((option: string) => {
      let labelValue = option.trim().split(',');

      let value, label = labelValue[0].trim();
      if (labelValue.length === 1) {
        value = normalizeRegexToString(label, INVALID_ID_CHARACTERS_REGEX, '');
      } else {
        value = labelValue[1].trim();
      }

      return {
        label: label,
        value: value
      }
    });
  }

  render() {
    const name: string = this.label && normalizeRegexToString(this.label, INVALID_ID_CHARACTERS_REGEX, '').toLowerCase();
    const placeholderSelected: boolean = this.options.findIndex((opt: Option) => opt.value === this.value) === -1;

    let placeholderElement = null;
    if (this.placeholder) {
      placeholderElement = <option
        disabled={true}
        label={this.placeholder}
        value={''}
        selected={placeholderSelected} />;
    }

    let selectOptionsList = [];
    if (this.options) {
      selectOptionsList = this.options.map((option: Option) => {
        const optValue = option.value ? option.value
          : option.label && normalizeRegexToString(option.label, INVALID_ID_CHARACTERS_REGEX, '');
        const isSelected: boolean = option.selected === true || this.value === optValue;
        return (
          <option
            value={optValue}
            label={option.label}
            selected={isSelected}
          >{option.label}</option>
        );
      });
    }

    return (
      <div class="form-group">
        <psk-label for={name} label={this.label} />

        <select name={name} id={name} class="form-control"
                disabled={this.disabled} required={this.required}
                multiple={this.selectionType === 'multiple'}
                onChange={this.__onChangeHandler.bind(this)} >

          {placeholderElement}
          {selectOptionsList}
        </select>
      </div>
    );
  }
}
