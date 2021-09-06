import { EmailBodyKeyParameters } from ".";

export interface EmailActionParameters {
    subjectKeys: string[];
    senderKey: string;
    recipientKeys: string[];
    ccKeys: string[];
    ccnKeys: string[];
    bodyKeys: EmailBodyKeyParameters[];
    subject: string;
    sender: string;
    body: string;
    recipientList: string[];
    ccList: string[];
    ccnList: string[];
    outputEventWhenComplete: string
}