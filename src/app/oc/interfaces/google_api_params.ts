export interface GoogleAPIParams {
    actionType: 'get_distance' | 'get_directions' | 'get_email_thread',
    directionsParams?: {
        originKey: string,
        destinationKey: string
    },
    distanceParams?: {
        originKey: string,
        destinationKey: string
    },
    emailThreadParams?: {
        emailIdKey: string,
        threadIdKey: string
    },
};