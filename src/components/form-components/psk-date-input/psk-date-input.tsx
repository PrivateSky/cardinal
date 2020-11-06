import { h, Component, Prop } from '@stencil/core';
import { BindModel } from '../../../decorators/BindModel';
import { TableOfContentProperty } from '../../../decorators/TableOfContentProperty';
import CustomTheme from '../../../decorators/CustomTheme';

const YEAR_LEADING_ZEROS = {
    0: '',
    1: '0',
    2: '00',
    3: '000'
};

@Component({
    tag: 'psk-date-input',
    styleUrl:"./psk-date-input.css"
})
export class PskDateInput {
    @CustomTheme()
    @BindModel() modelHandler;

    render() {
        const {
            dateToDisplay,
            dateToAssign
        } = this.__getFormattedDate();

        return <psk-input
            type="date"
            label={this.label}
            name={this.name}
            value={dateToAssign}
            placeholder={this.placeholder}
            required={this.required === 'true'}
            readOnly={this.readOnly}
            invalidValue={this.invalidValue}
            specificProps={{
                onKeyUp: this.__inputHandler.bind(this),
                onChange: this.__inputHandler.bind(this),
                onfocusout: this.__focusOutHandler.bind(this),
                "data-date": dateToDisplay,
                class: this.dataFormat && !this.__isSafari() ? "form-control formated-date" : 'form-control'
            }} />
    }

    __getBrowser = () => {
      let userAgent = navigator.userAgent,tem,M=userAgent.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
      if(/trident/i.test(M[1])){
        tem=/\brv[ :]+(\d+)/g.exec(userAgent) || [];
        return {name:'IE',version:(tem[1]||'')};
      }
      if(M[1]==='Chrome'){
        tem=userAgent.match(/\bOPR|Edge\/(\d+)/)
        if(tem!=null)
        {
          return {name:'Opera', version:tem[1]};
        }
      }
      M=M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
      if((tem=userAgent.match(/version\/(\d+)/i))!=null) {M.splice(1,1,tem[1]);}
      return {
        name: M[0],
        version: M[1]
      };
    }

    __isSafari = () => {
      return this.__getBrowser().name.indexOf('Safari') !== -1;
    }

    __inputHandler = (event) => {
        event.stopImmediatePropagation();
        if(!this.__isSafari()){
          this.__focusOutHandler(event);
        }
    };

  __focusOutHandler = (event) => {
    event.stopImmediatePropagation();
    let currentDate = event.target.value;

    if (currentDate && currentDate.trim().length) {
      const newValue = new Date(currentDate).getTime();
      this.modelHandler.updateModel('value', newValue);
    }
  };

    __getFormattedDate = () => {
        if (!this.value || !this.value.trim().length) {
            return {};
        }

        let newDate = new Date(parseInt(this.value));
        const utcYear: number = newDate.getUTCFullYear();
        const utcMonth: number = newDate.getUTCMonth() + 1;
        const utcDayOfMonth: number = newDate.getUTCDate();

        const day = utcDayOfMonth <= 9 ? `0${utcDayOfMonth}` : `${utcDayOfMonth}`;
        const month = utcMonth <= 9 ? `0${utcMonth}` : `${utcMonth}`;

        let year = utcYear.toString();
        const leadingZeros = year.length < 4 ? 4 - year.length : 0;
        year = `${YEAR_LEADING_ZEROS[leadingZeros]}${year}`;

        const dateVariables = {
            "DD": day,
            "MM": month,
            "YYYY": year
        };

        const dateValue = "YYYY MM DD".split(' ')
            .map((type: string) => dateVariables[type])
            .join("-");

        const formattedDate: string = this.dataFormat
            ? this.dataFormat.trim()
                .split(' ')
                .map((type: string) => dateVariables[type])
                .join('/')
            : dateValue;
        return {
            dateToDisplay: formattedDate,
            dateToAssign: dateValue
        };
    }

    @TableOfContentProperty({
        description: [`By filling out this property, the component will display above it, a label using <psk-link page="forms/psk-label">psk-label</psk-link> component.`],
        isMandatory: false,
        propertyType: 'string',
        specialNote: `If this property is not provided, the component will be displayed without any label`
    })
    @Prop() label?: string | null = null;

    @TableOfContentProperty({
        description: [`Specifies the value of an psk-date-input component.`,
            `This value is updated also in the model using the two-way binding. Information about two-way binding using models and templates can be found at: <psk-link page="forms/using-forms">Using forms</psk-link>.`,
            `This property should respect the format give nto the data-format property.`],
        isMandatory: false,
        propertyType: 'string'
    })
    @Prop() value?: string | null = null;

    @TableOfContentProperty({
        description: [`Specifies the name of a psk-date-input component. It is used along with the psk-label component.`],
        isMandatory: false,
        propertyType: 'string'
    })
    @Prop() name?: string | null = null;

    @TableOfContentProperty({
        description: [`Specifies a short hint that describes the expected value of an psk-date-input component`],
        isMandatory: false,
        propertyType: 'string'
    })
    @Prop() placeholder?: string | null = null;

    @TableOfContentProperty({
        description: [`Specifies that an input field must be filled out before submitting the form.`,
            `Accepted values: "true" and "false"`],
        isMandatory: false,
        propertyType: 'boolean',
        defaultValue: "false"
    })
    @Prop() required?: string = "false";

    @TableOfContentProperty({
        description: [`	Specifies that an input field is read-only.`,
            `Accepted values: "true" and "false"`],
        isMandatory: false,
        propertyType: 'boolean',
        defaultValue: "false"
    })
    @Prop() readOnly?: boolean = false;

    @TableOfContentProperty({
        description: [`This property indicates if the value entered by the user is a valid one according to some validation present in the controller.`],
        isMandatory: false,
        propertyType: 'boolean'
    })
    @Prop() invalidValue?: boolean | null = null;

    @TableOfContentProperty({
        isMandatory: false,
        description: `This property is the format of the date. At the moment the component can format only "MM DD YYYY", "DD MM YYYY", "MM YYYY DD", "YYYY MM DD", "YYYY DD MM" and "DD YYYY MM".`,
        propertyType: 'string',
        defaultValue: "null"
    })
    @Prop() dataFormat?: string | null = null;

}
