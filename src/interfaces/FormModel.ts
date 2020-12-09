export type RowType = 'normal' | 'wide';
export type SelectType = 'single' | 'multiple';
export type FormActionType = 'submit' | 'reset';
export type FormComponentType = 'psk-input' | 'psk-radio' | 'psk-checkbox' | 'psk-select' | 'psk-label';

export interface RadioOption {
    label: string;
    value?: string;
    name?: string;
    checked?: boolean;
    /**
     * By using this property, you can disable the option from being checked.
     * This can be used for conditionals
     */
    readOnly?: boolean;
}

/**
 * Option interface is used to define the options for a dropdown list select.
 * It can be multiple or single selection.
 */
export interface Option {
    label: string;
    value?: string;
    selected?: boolean;
    /**
     * By using this property, you can disable the option from being selected.
     * This can be used for conditionals
     */
    disabled?: boolean;
};


/**
 * DraggableOption interface is used to define the options for a draggable list component.
 * It can be single selection.
 */
export interface DraggableOption {
  label: string;
  value: string;
  selected?: boolean;
};

/**
 * FormAction interface is used to define the list of action buttons form the form
 * E.g.: Submit, Reset, Cancel, Go Back...
 *
 * If eventName property will be set, inside the DefaultController of the application or in the controller
 * of the form, that event needs to be listened, otherwise, the triggered event is useless.
 *
 * type property has two possible values, standard for HTML: submit and reset.
 * If no type is provided, submit is assumed.
 */
export interface FormAction {
    name: string;
    eventName?: string;
    type?: FormActionType;
};

/**
 * The FormRow interface defines a list of components that can be grouped as a row using the rowType property
 * The rowType property has two possible values, wide and normal.
 * If wide is provided, than each component will be displayed in a single row.
 * If normal is provided, each row will be formed using 3 components
 * If this property is not provided, wide will be assumed.
 */
export interface FormRow {
    row: Array<FormComponent>;
    rowType?: RowType;
};

export interface FormComponent {
    /**
     * For the momment, the possible values are:
     * psk-input, psk-radio, psk-checkbox, psk-select, psk-label
     */
    componentName: FormComponentType;
    label?: string;
    /**
     * This is the type of the input like in standsrd HTML: text, email, password...
     * The full list of possible types is available on https://www.w3schools.com/html/html_form_input_types.asp
     * The property is optional.
     */
    type?: string;
    /**
     * This is the value that will be displayed when the form is loaded.
     * The property is optional.
     */
    defaultValue?: string;

    /**
     * This is the property that is setting the input to be required or not.
     * The property is optional.
     * If not value is provided, false is assumed.
     */
    required?: boolean;
    /**
     * This is the property that is setting the input to be read only or not.
     * The property is optional.
     * If not value is provided, false is assumed.
     */
    readOnly?: boolean;
    /**
     * Used only for checkboxes
     */
    checked?: boolean;

    /**
     * Used for input fields
     */
    value?: string;
    /**
     * Used for input fields
     */
    placeHolder?: string;
    /**
     * Used to store the list of selected values
     * Available only for selection list component with type multiple
     */
    values?: Array<string>;

    /**
     * Used for radio buttons and selection lists
     */
    options?: Array<Option>;

    /**
     * This property will be filled inside controller if the component does not pass the validation step
     */
    invalidValue?: boolean;

    /**
     * Select type is used to determinate the selection if it is single or multiple
     * Possible values are: single and multiple. If no value is provided, single is assumed
     */
    selectionType?: SelectType;
};

/**
 * The base for a form
 * Each form will need a FormModel in order to be generated
 */
export interface FormModel {
    components: Array<FormRow>;
    actions?: Array<FormAction>;
};
