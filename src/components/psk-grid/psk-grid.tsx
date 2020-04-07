import { Component, Prop, h, Element } from '@stencil/core';
import { TableOfContentProperty } from '../../decorators/TableOfContentProperty';
import CustomTheme from '../../decorators/CustomTheme';
import { GRID_IGNORED_COMPONENTS, GRID_BREAKPOINTS, GRID_HIDDEN_BREAKPOINTS } from '../../utils/constants';
import { BindModel } from '../../decorators/BindModel';

interface BreakPoint {
	breakpoint: string,
	values: Array<string>
};

@Component({
	tag: "psk-grid",
  styleUrl:"../../../themes/commons/bootstrap/css/bootstrap.css"
})
export class PskGrid {
	@BindModel()

	@CustomTheme()

	@TableOfContentProperty({
		isMandatory: true,
		propertyType: 'number',
		description: 'This is the number of columns for the bootstrap columns class. ',
		defaultValue: 'null',
		specialNote: `That number can only be an integer between 1 and 12.`
	})
	@Prop() columns: number | null = null;

	@TableOfContentProperty({
		isMandatory: true,
		propertyType: 'string',
		description: ['This attribute will set the layout for the components inside the grid, according to the number of columns.',
			`Example: <psk-grid columns="3" layout="xs=[12,12,12] s=[6,6,12] m=[3,3,6] l=[3,4,5]" xl=[3,4,5]>`,
			`There are 5 possible breakpoints, according to Bootstrap documentation: xs, s, m, l and xl. For each breakpoint you want to use, the number of the values must be the same with the number of the columns, otherwise, the breakpoint will be ignored.`,
			`Each breakpoint will be written in the following manner: breakpoint=[value1, value2,... valueN], where N is the number of columns and the value accepts numbers between 0 and 12 included, or the string "auto".`,
			`If a value is 0, then the element for that column will be hidden. If a value is auto, it will have no bootstrap class and will inherit the design.`,
			`If any other value is set, the breakpoint will be ignored even if it has the same number of columns.`],
		defaultValue: 'null'
	})
	@Prop() layout: string | null = null;

	@Element() _host: HTMLElement;

	render() {
		let htmlSlotChildren: Array<Element> = Array.from(this._host.children);
		let htmlChildren: Array<Element> = [];

		if (!this.columns || !this.layout) {
			return <slot />;
		}

		let mappedBoostrapRules: Array<BreakPoint> = this._createLayoutRules.call(this);

		if (mappedBoostrapRules.length === 0) {
			return <slot />;
		}

		let index = 0;
		htmlSlotChildren.forEach((child: Element) => {
			if (GRID_IGNORED_COMPONENTS.indexOf(child.tagName.toLowerCase()) >= 0) {
				return;
			}
			let classList: string = '';

			mappedBoostrapRules.forEach((rule: BreakPoint) => {
				switch (rule.breakpoint) {
					case 'xs': {
						classList += this._getClass('xs', rule.values[index]);
						break;
					}
					case 's': {
						classList += this._getClass('sm', rule.values[index]);
						break;
					}
					case 'm': {
						classList += this._getClass('md', rule.values[index]);
						break;
					}
					case 'l': {
						classList += this._getClass('lg', rule.values[index]);
						break;
					}
					case 'xl': {
						classList += this._getClass('xl', rule.values[index]);
						break;
					}
					default: break;
				}
			});

			child.className = `${child.className.trim()} ${classList.trim()}`.trim();
			index = (index + 1) % this.columns;

			htmlChildren.push(child.parentNode.removeChild(child));
		});

		let done: boolean = false;
		while (!done) {
			let rowElements: Array<Element> = htmlChildren.splice(0, Math.min(this.columns, htmlChildren.length));

			let row: HTMLDivElement = document.createElement('div');
			row.className = "row";
			rowElements.forEach(function (child: Element) {
				row.appendChild(child);
			});

			this._host.appendChild(row);

			done = htmlChildren.length === 0;
		}

		return <slot />;
	}

	_getClass(bkpt: string, value: string) {
		let classes: string = '';

		switch (value) {
			case "0": {
				classes += `${GRID_HIDDEN_BREAKPOINTS[bkpt]} `;
				break;
			}
			default: {
				classes += `col-${bkpt}-${value} `;
				break;
			}
		}

		return classes;
	}

	_createLayoutRules() {
		let self = this;
		let breakpointsSet = this.layout.split("\]")
			.map(function (rule) {
				return `${rule.trim().toLowerCase()}]`;
			});

		let filteredBreakpoints = breakpointsSet.filter(function (rule) {
			let _split = rule.split('=');

			if (_split.length === 0) {
				return false;
			}

			if (GRID_BREAKPOINTS.indexOf(_split[0].trim()) === -1) {
				return false;
			}

			let values = _split[1].replace("\[", "").replace("\]", "")
				.split(",").map(function (value) {
					return value.trim();
				})
				.filter(function (value) {
					if (value === 'auto') {
						return true;
					}
					if (parseInt(value) < 13 && parseInt(value) >= 0) {
						return true;
					}
					return false;
				});

			if (values.length !== self.columns) {
				return false;
			}

			return true;
		})

		let breakpoints = filteredBreakpoints.map(function (rule) {
			let _split = rule.split('=');
			let breakpoint = _split[0].trim();
			let values = _split[1].replace("\[", "").replace("\]", "")
				.split(",").map(function (value) {
					return value.trim();
				});

			return {
				breakpoint: breakpoint,
				values: values
			};
		});

		return breakpoints;
	}
}
