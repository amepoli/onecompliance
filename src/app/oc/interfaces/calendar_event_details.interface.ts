export interface CalendarEventDetails {
    title: string;
    calendar:  string;
    startDate:  string;
    endDate:  string;
    organizer:  string;
    attachment:  string;
    participants:  string[];
    description: string;
    object_name: any; //: "sondaggi",
    object_id: string; //: {"id_sondaggio": "130", "codice_azienda": "DEMO"},
}