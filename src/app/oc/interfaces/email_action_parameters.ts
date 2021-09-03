export interface EmailActionParameters {
    subjectKeys: string[];
    recipientKeys: string[];
    ccKeys: string[];
    ccnKeys: string[];
    bodyKeys: string[];
    subject: string;
    body: string;
    recipientList: string[];
    ccList: string[];
    ccnList: string[];
}