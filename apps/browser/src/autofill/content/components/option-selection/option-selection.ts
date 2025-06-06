import createEmotion from "@emotion/css/create-instance";
import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";

import { Theme, ThemeTypes } from "@bitwarden/common/platform/enums";

import { OptionSelectionButton } from "../buttons/option-selection-button";
import { Option } from "../common-types";

import { optionItemIconWidth } from "./option-item";
import { OptionItems, optionsMenuItemMaxWidth } from "./option-items";

export const optionSelectionTagName = "option-selection";

const { css } = createEmotion({
  key: optionSelectionTagName,
});

export class OptionSelection extends LitElement {
  @property()
  disabled: boolean = false;

  @property()
  label?: string;

  @property({ type: Array })
  options: Option[] = [];

  @property()
  theme: Theme = ThemeTypes.Light;

  @property({ type: (selectedOption: Option["value"]) => selectedOption })
  handleSelectionUpdate?: (args: any) => void;

  @property({ attribute: false })
  selectedSignal?: { set: (value: any) => void };

  @state()
  private showMenu = false;

  @state()
  private menuTopOffset: number = 0;

  // Determines if the opened menu should be "anchored" to the right or left side of the opening button
  @state()
  private menuIsEndJustified: boolean = false;

  @state()
  private selection?: Option;

  private handleButtonClick = (event: Event) => {
    if (!this.disabled) {
      // Menu is about to be shown
      if (!this.showMenu) {
        this.menuTopOffset = this.offsetTop;

        // Distance from right edge of button to left edge of the viewport
        // Assumes no enclosing frames between the intended host frame and the component
        const boundingClientRect = this.getBoundingClientRect();

        // Width of the client (minus scrollbar)
        const documentWidth = document.documentElement.clientWidth;

        // Distance between left edge of the button and right edge of the viewport
        // (e.g. the max space the menu can use when left-aligned)
        const distanceFromViewportRightEdge = documentWidth - boundingClientRect.left;

        // The full width the option menu can take up
        // (base + icon + border + gap + padding)
        const maxDifferenceThreshold =
          optionsMenuItemMaxWidth + optionItemIconWidth + 2 + 8 + 12 * 2;

        this.menuIsEndJustified = distanceFromViewportRightEdge < maxDifferenceThreshold;
      }

      this.showMenu = !this.showMenu;
    }
  };

  private handleOptionSelection = (selectedOption: Option) => {
    this.showMenu = false;
    this.selection = selectedOption;
    this.selectedSignal?.set(selectedOption.value);
    // Any side-effects that should occur from the selection
    this.handleSelectionUpdate?.(selectedOption.value);
  };

  protected createRenderRoot() {
    return this;
  }

  render() {
    if (!this.selection) {
      this.selection = getDefaultOption(this.options);
    }

    return html`
      <div class=${optionSelectionStyles({ menuIsEndJustified: this.menuIsEndJustified })}>
        ${OptionSelectionButton({
          disabled: this.disabled,
          icon: this.selection?.icon,
          text: this.selection?.text,
          theme: this.theme,
          toggledOn: this.showMenu,
          handleButtonClick: this.handleButtonClick,
        })}
        ${this.showMenu
          ? OptionItems({
              label: this.label,
              options: this.options,
              theme: this.theme,
              topOffset: this.menuTopOffset,
              handleOptionSelection: this.handleOptionSelection,
            })
          : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [optionSelectionTagName]: OptionSelection;
  }
}

export default customElements.define(optionSelectionTagName, OptionSelection);

function getDefaultOption(options: Option[] = []) {
  return options.find((option: Option) => option.default) || options[0];
}

const optionSelectionStyles = ({ menuIsEndJustified }: { menuIsEndJustified: boolean }) => css`
  display: flex;
  justify-content: ${menuIsEndJustified ? "flex-end" : "flex-start"};

  > div,
  > button {
    width: 100%;
  }
`;
