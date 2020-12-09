import {Component, h, State} from "@stencil/core";
import CustomTheme from "../../decorators/CustomTheme";
import {BindModel} from "../../decorators";
import {IndexedOption} from "../../interfaces/FormModel";

@Component({
  tag: "psk-draggable-list",
  styleUrl: "./psk-draggable-list.css"
})
export class PskDraggableList {
  @CustomTheme()

  @BindModel() modelHandler;

  @State() items: Array<IndexedOption>;

  SWAP_TYPE = {
    UP: 'up',
    DOWN: 'down'
  }

  __onItemClick(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    let array = JSON.parse(JSON.stringify(this.items));
    let itemId = event.target.id.split("item-")[1];
    let selectedIndex = array.findIndex(item => item.value === itemId);
    if (selectedIndex === -1 || array.length === 0) {
      return;
    }
    let nextState = !array[selectedIndex].selected;
    array = array.map(item => {
      return {
        ...item,
        selected: false
      }
    })

    array[selectedIndex] = {
      ...array[selectedIndex],
      selected: nextState
    }
    this.items = array;
  }

  __onItemsChange(event, swapType) {
    event.preventDefault();
    event.stopImmediatePropagation();
    let itemArray = JSON.parse(JSON.stringify(this.items));
    let selectedIndex = itemArray.findIndex(item => item.selected === true);
    let limitIndex, toChangeIndex;

    switch (swapType) {
      case this.SWAP_TYPE.UP: {
        limitIndex = 0;
        toChangeIndex = selectedIndex - 1;
        break;
      }
      case this.SWAP_TYPE.DOWN: {
        limitIndex = itemArray.length - 1;
        toChangeIndex = selectedIndex + 1;
        break;
      }
      default: {
        return;
      }
    }

    if (selectedIndex === -1 || selectedIndex === limitIndex) {
      return;
    }

    let currentElement = itemArray[selectedIndex];
    itemArray[selectedIndex] = itemArray[toChangeIndex];
    itemArray[toChangeIndex] = currentElement;

    this.items = itemArray;
    this.modelHandler.updateModel('items', itemArray);
  }

  __clearMultipleSelections() {
    let items = this.items;
    if (items === undefined) {
      return;
    }

    let foundSelection = false;
    let itemsLength = items.length;

    for (let i = 0; i< itemsLength; i++) {
      if (items[i].selected === true && foundSelection === false) {
        foundSelection = true;
      } else {
        items[i].selected = false;
      }
    }
    this.items = items;
  }

  componentDidLoad() {
    if (this.items) {
      this.__clearMultipleSelections()
    }
  }

  render() {
    let renderedItems = this.items ? this.items.map((item) => {
      if (item.selected && item.selected === true) {
        return <div class="selectedItem" id={"item-" + item.value} onClick={(e) => this.__onItemClick(e)}>
          <p>{item.label}</p>
          <div class="arrow-button-container">
            <psk-button class="arrow-button" onClick={e => this.__onItemsChange(e, this.SWAP_TYPE.UP)}>
              <psk-icon icon="arrow-up" color="rgb(255, 255, 255)"></psk-icon>
            </psk-button>
            <psk-button class="arrow-button" onClick={e => this.__onItemsChange(e, this.SWAP_TYPE.DOWN)}>
              <psk-icon icon="arrow-down" color="rgb(255, 255, 255)"></psk-icon>
            </psk-button>
          </div>
        </div>
      }
      return <div class="clearItem" id={"item-" + item.value} onClick={(e) => this.__onItemClick(e)}>
        {item.label}
      </div>
    }) : <p>Items were not provided.</p>

    return <div>
      {renderedItems}
    </div>;
  }
}
