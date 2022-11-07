import { ReportItem } from "./report_item.interface";

export interface ReportList {
    entryName: string;
    lazyLoaded: boolean;
    reports: ReportItem[]
};