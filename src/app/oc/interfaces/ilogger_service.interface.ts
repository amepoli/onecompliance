export interface ILoggerService {
    info(value: any, ...rest: any[]): void;
    log(value: any, ...rest: any[]): void;
    warn(value: any, ...rest: any[]): void;
    error(value: any, ...rest: any[]): void;
    table(value: any, ...rest: any[]): void;
}
