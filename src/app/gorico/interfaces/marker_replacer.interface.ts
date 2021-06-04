export interface MarkerReplacer {
    /**
     * Marker
     */
    marker: string;
    replace:
    /**
     * Replace marker with value
     * @param context you should pass 'this' as context
     * @param value value to replace with marker
     * @returns replaced string 
     */
    (context: any, value: string) => string;
};
