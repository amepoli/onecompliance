export interface GoogleAPIParams {
    actionType: 'get_distance' | 'get_directions' | 'get_email_thread' | 'get_emails_by_codice_azienda' | 'create_drive_folder' | 'copy_s3_to_drive' | 'copy_drive_to_s3' | 'get_drive_changes' | 'get_folder_expanded_contents',
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
    driveFolderParams? : {
        driveFolderKey: string
    },
    s3ToDriveParams? : {
        s3PathKey: string,
        drivePathKey: string
    },
    driveToS3Params? : {
        drivePathKey: string,
        s3PathKey: string
    },
    driveExpandedContentsParams? : {
        codiceAziendaKey: string;
        idAnagraficaKey: string;
        idProgettoKey?: string;
        idRisorsaKey?: string;
    }
};