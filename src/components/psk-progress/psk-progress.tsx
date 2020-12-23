import {h, Component, Prop} from '@stencil/core';

import { BindModel } from '../../decorators/BindModel';
import CustomTheme from '../../decorators/CustomTheme';
import {TableOfContentProperty} from "../../decorators";

@Component({
    tag: 'psk-progress',
    styleUrl: './psk-progress.css'
})
export class PskProgress {

    @CustomTheme()
    @BindModel() modelHandler;

    @TableOfContentProperty({
      description: `This property is used to set the progress percent`,
      isMandatory: false,
      propertyType: `number`,
      defaultValue: 0
    })
    @Prop() value: number = 0;

    @TableOfContentProperty({
      description: `This property is used to set the max progress percent`,
      isMandatory: false,
      propertyType: `number`,
      defaultValue: 100
    })
    @Prop() max: number = 100;

    @TableOfContentProperty({
      description: `This property is used to set the progress bar color`,
      isMandatory: false,
      propertyType: `string`
    })
    @Prop() color: string = null;

    @TableOfContentProperty({
      description: `This property is used to set the label of the progress bar`,
      isMandatory: false,
      propertyType: `string`
    })
    @Prop() label: string = null;

    render() {
        let safeValue = this.value, safeMax = this.max;
        if (safeValue < 0) {
          safeValue = 0;
        }
        if (safeValue > 100) {
          safeValue = 100;
        }
        if (safeMax < 0) {
          safeMax = 0;
        }
        if (safeMax > 100) {
          safeMax = 100;
        }
        if (safeMax < safeValue) {
          safeValue = safeMax;
        }

        return <div class="psk-progress">
          {this.label == null ? null : <label>{this.label}</label>}
          <div>
            {this.value == null ? null : <label class="overTheProgress">{safeValue + '%'}</label>}
            <progress class={this.color} max={safeMax} value={safeValue}></progress>
          </div>
        </div>
    }
}
