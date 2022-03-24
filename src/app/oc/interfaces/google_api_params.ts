export interface GoogleAPIParams {
    actionType: 'get_distance' | 'get_directions' | 'get_email_thread' | 'create_drive_folder' | 'copy_s3_to_drive' | 'copy_drive_to_s3',
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
    S3ToDriveParams? : {
        s3PathKey: string,
        drivePathKey: string
    },
    DriveToS3Params? : {
        drivePathKey: string,
        s3PathKey: string
    }
};