import { Component, h, Prop, Listen, getElement } from '@stencil/core';

import CustomTheme from '../../decorators/CustomTheme';
import { TableOfContentProperty } from '../../decorators/TableOfContentProperty';
import { BindModel } from '../../decorators/BindModel';


@Component({
    tag: 'psk-button-group'
})
export class ButtonGroup {
    @BindModel()

    @CustomTheme()

    render() {
        if (!this.label && !this.icon) {
            return null;
        }

        return (
            <div class={`button-group-wrapper ${this.classes}`}>
                <div class="trigger" onClick={this._handleMouseClick}>
                    {this.icon && <psk-icon icon={this.icon} color={this.iconColor} />}
                    {this.label && this.label}
                </div>
                <div class="list-group">
                    <slot />
                </div>
            </div>
        );
    }

    _handleMouseClick = (evt: MouseEvent) => {
        evt.preventDefault();
        evt.stopImmediatePropagation();

        let target = evt.target as HTMLElement;
        if (getElement(this).contains(target)) {
            this.opened = !this.opened;
        }
    }

    @Listen('click', { capture: true, target: "window" })
    handleClickOutside(evt: Event) {
        let target = evt.target as HTMLElement;
        let thisElement: HTMLElement = getElement(this);
        let targetInPath = evt.composedPath().indexOf(thisElement) > -1;

        // Turn off the menu, only if the click is coming from outside the component.
        // If the click is coming from outside the component, let the onClick event attached to the div.trigger handle the click
        if (!thisElement.contains(target) && !targetInPath) {
            this.opened = false;
        }
    }

    @TableOfContentProperty({
        description: [
            `This property shows the state of the button group, if it is expanded or collapsed.`
        ],
        isMandatory: false,
        propertyType: `boolean`,
        defaultValue: `false`
    })
    @Prop({ reflectToAttr: true, mutable: true }) opened: boolean = false;

    @TableOfContentProperty({
        description: [
            'This is the label that will be displayed for the button. If it is not set, the button group will not be displayed.',
        ],
        isMandatory: true,
        propertyType: 'string'
    })
    @Prop() label: string | null;

    @TableOfContentProperty({
        isMandatory: false,
        propertyType: 'string',
        description: [
            'This property gives the color of the icon.'
        ],
        defaultValue: 'null'
    })
    @Prop() icon: string | null;

    @TableOfContentProperty({
        isMandatory: true,
        propertyType: 'string',
        description: [
            `This property is mandatory and it is the icon defined in font-awesome Cascading Style Sheet .`,
            `We choose to use these icons because they are popular and quite expressive and very easy to use.(Example: user, eye, share, download`
        ]
    })
    @Prop() iconColor: string | null;

    @TableOfContentProperty({
        isMandatory: false,
        propertyType: 'string',
        description: [
            `By defining this property, you can assign more css classes according to your design needs.`,
            `These classes will be attached to the existing class, <code>button-group-wrapper</code>. Below in the examples section, this attribute is better illustrated.`
        ]
    })
    @Prop() classes: string | null = '';
}