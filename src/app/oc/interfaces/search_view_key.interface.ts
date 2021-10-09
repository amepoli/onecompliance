
export interface SearchViewKey { // as per API specification
    fieldName: string;	// form field name, might or not correspond to a postgres column
    newLine: boolean; 	// new line with the next field
    label: string;		// displayed key name
    queryCond: string; 	// postgres query condition (after WHERE clause), mandatory to link w/ a Postgres column
    format: {		//  DataFormat type
        viewType: string; 		// form view type, one among “input” | “combobox” | “checkbox” | “radiobutton” 
        dataType?: string; 				//  only if viewtype=”input”
        value?: any;  		// default value
        options?: [					// in caseof combobox | radiobutton
            {
                id: number,			// combobox entry ID
                name: string			// displayed entry value
            }];
        comboQuery?: string,		// combobox query, returns an array of [{“id”: Number, “name”: String}]
    };
    isVisible: boolean;
    width: string;
    showSwitch?: boolean;
    switchLabel?: string;
    switchOnValue?: any;
}