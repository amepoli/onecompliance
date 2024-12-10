export interface NotifyTicketParams {
    actionType: 'open_ticket' | 'close_ticket',
    openTicketParams?: {
        chiavi: string,
        contesto: string,
        username: string
    },
    closeTicketParams?: {
        chiavi: string,
        contesto: string,
        username: string
    }
};