import { delay, interval, lastValueFrom, Observable, of } from "rxjs";

// export const AsyncTask = (task: Observable<any>, onSuccess: (data: any) => {}, onError: (error: any) => {}) => (
//     task.subscribe(
//         data => {
//             onSuccess(data);
//         },
//         error => {
//             onError(error);
//         }
// ));

export const AsyncUtil = {
    toPromise: async (
        task: Observable<any>,
    ): Promise<{ result: any; error: any }> => {
        try {
            const result = await lastValueFrom(task);
            return {
                result: result,
                error: undefined,
            };
        } catch (e) {
            return {
                result: undefined,
                error: e,
            };
        }
    },
    runDelayed: async (task: Function, delayTime: number) => {
        await lastValueFrom(of([]).pipe(delay(delayTime)));
        task();
    },
    runInterval: async (task: Function, delayTime: number) => {
        const intervals = interval(delayTime);
        intervals.forEach(() => {
            task();
        });
    },
};
