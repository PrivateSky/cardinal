import { Component, h, Prop, getElement } from "@stencil/core";
import { closestParentElement, scrollToElement } from "../../utils/utils";
// import { TOOLTIP_TEXT, TOOLTIP_COPIED_TEXT } from "../../decorators/declarations/constants";

@Component({
    tag: "psk-copy-clipboard",
    styleUrl: './page.css'
})

export class PskCard {

    @Prop() id: string = "";

    _copyToClipboardHandler(elementId: string): void {
        try {
            const pskPageElement = closestParentElement(getElement(this), 'psk-page');

            let basePath = window.location.href;
            if (window.location.href.indexOf("?chapter=") !== -1) {
                basePath = window.location.href.split("?chapter=")[0];
            }

            const clipboardText = `${basePath}?chapter=${elementId}`;

            const copyInput: HTMLInputElement = document.createElement('input');
            pskPageElement.appendChild(copyInput);
            copyInput.setAttribute('value', clipboardText);

            copyInput.select();
            copyInput.setSelectionRange(0, 99999);

            document.execCommand("copy");

            scrollToElement(elementId, pskPageElement);
            // this.element.querySelector('#tooltip').innerHTML = TOOLTIP_COPIED_TEXT
            pskPageElement.removeChild(copyInput);
        } catch (err) {
            console.error(err);
        }
    }

    _resetTooltip(): void {
        // this.element.querySelector('#tooltip').innerHTML = TOOLTIP_TEXT
    }

    _isCopySupported(): boolean {
        let support: boolean = !!document.queryCommandSupported;

        ['copy', 'cut'].forEach((action) => {
            support = support && !!document.queryCommandSupported(action);
        });
        return support;
    }

    render() {

        const elementId = this.id.trim().replace(/( |:)/g,"-").toLowerCase();
        if (elementId.length === 0 || !this._isCopySupported()) {
            return;
        }

        return (
            <span>
                <a class="mark"
                    href={`#${elementId}`}
                    onClick={(evt: MouseEvent) => {
                        evt.preventDefault();
                        evt.stopImmediatePropagation();
                        this._copyToClipboardHandler(elementId);
                    }}
                    onMouseOut={() => {
                        this._resetTooltip();
                    }} >
                    <slot />
                </a>
            </span>
        )
    }
}