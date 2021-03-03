import { Component, Element, Prop, Host, h } from '@stencil/core';

import CustomTheme from '../../../decorators/CustomTheme';
import { applyStyles, generateRule } from '../psk-layout.utils';
import { TableOfContentProperty } from "../../../decorators/TableOfContentProperty";
import { BindModel } from "../../decorators/BindModel";

@Component({
  tag: 'psk-layout',
  shadow: true
})

export class PskLayout {
  @BindModel() modelHandler;
  
  @CustomTheme()

  @Element() private __host: HTMLElement;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>grid-template-columns</em>.`,
      `You can use all available CSS keywords and functions, for example:
        <code>repeat</code>,
        <code>minmax</code>,
        <code>auto</code>,
        <code>min-content</code>,
        <code>max-content</code>,
        <code>fr</code>,
        etc.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() templateColumns: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>grid-template-rows</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() templateRows: string | null = null;

  @TableOfContentProperty({
    description: [
      `The property represents the number of columns that the grid will have.`,
      `It produces the same result as <code>template-columns="repeat(number-of-columns, 1fr)"</code>.`
    ],
    isMandatory: false,
    propertyType: `number`
  })
  @Prop() columns: number | null = null;

  @TableOfContentProperty({
    description: [
      `The property represents the number of rows that the grid will have.`,
      `It produces the same result as <code>template-rows="repeat(number-of-rows, 1fr)"</code>.`
    ],
    isMandatory: false,
    propertyType: `number`
  })
  @Prop() rows: number | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>grid-auto-columns</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() autoColumns: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>grid-auto-rows</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() autoRows: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>grid-auto-flow</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() autoFlow: string | null = null;

  @TableOfContentProperty({
    description: '',
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() gap: string | null = null;

  @TableOfContentProperty({
    description: '',
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() columnGap: string | null = null;

  @TableOfContentProperty({
    description: '',
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() rowGap: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>place-items</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() alignItems: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>justify-items</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() alignItemsX: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>align-items</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() alignItemsY: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>place-content</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() alignContent: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>justify-content</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() alignContentX: string | null = null;

  @TableOfContentProperty({
    description: [
      `Equivalent to <em>align-content</em>.`
    ],
    isMandatory: false,
    propertyType: `string`
  })
  @Prop() alignContentY: string | null = null;

  async componentWillLoad() {
    const styles = generateRule(':host', this.__getProperties());
    applyStyles(this.__host, styles);
  }

  __getProperties() {
    const properties = { 'display': 'grid' };

    if (this.templateColumns) properties['grid-template-columns'] = this.templateColumns;
    else if (this.columns) properties['grid-template-columns'] = `repeat(${this.columns}, 1fr)`;

    if (this.templateRows) properties['grid-template-rows'] = this.templateRows;
    else if (this.rows) properties['grid-template-rows'] = `repeat(${this.rows}, 1fr)`;

    if (this.autoFlow) properties['grid-auto-flow'] = this.templateRows;
    if (this.autoColumns) properties['grid-auto-columns'] = this.templateRows;
    if (this.autoRows) properties['grid-auto-rows'] = this.templateRows;

    if (this.gap) properties['gap'] = this.gap;
    if (this.columnGap) properties['column-gap'] = this.columnGap;
    if (this.rowGap) properties['row-gap'] = this.rowGap;

    if (this.alignItems) properties['place-items'] = this.alignItems;
    if (this.alignItemsX) properties['justify-items'] = this.alignItemsX;
    if (this.alignItemsY) properties['align-items'] = this.alignItemsY;

    if (this.alignContent) properties['place-content'] = this.alignContent;
    if (this.alignContentX) properties['justify-content'] = this.alignContentX;
    if (this.alignContentY) properties['align-content'] = this.alignContentY;

    return properties;
  }

  render() {
    return (
      <Host>
        <slot/>
      </Host>
    )
  }
}
