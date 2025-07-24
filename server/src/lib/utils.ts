export type OperationSuccess<T> = readonly [data: T, error: null];
export type OperationFailure<E> = readonly [data: null, error: E];
export type OperationResult<T, E> = OperationSuccess<T> | OperationFailure<E>;

type Operation<T> = Promise<T> | (() => T) | (() => Promise<T>);

export function trycatch<T, E = Error>(operation: Promise<T>): Promise<OperationResult<T, E>>;
export function trycatch<T, E = Error>(operation: () => never): OperationResult<never, E>;
export function trycatch<T, E = Error>(operation: () => Promise<T>): Promise<OperationResult<T, E>>;
export function trycatch<T, E = Error>(operation: () => T): OperationResult<T, E>;
export function trycatch<T, E = Error>(
    operation: Operation<T>,
): OperationResult<T, E> | Promise<OperationResult<T, E>> {
    try {
        const result = typeof operation === 'function' ? operation() : operation;

        if (isPromise(result)) {
            return Promise.resolve(result)
                .then((data) => onSuccess(data))
                .catch((error) => onFailure(error));
        }

        return onSuccess(result);
    } catch (error) {
        return onFailure<E>(error);
    }
}

const onSuccess = <T>(value: T): OperationSuccess<T> => {
    return [value, null];
};

const onFailure = <E>(error: unknown): OperationFailure<E> => {
    const errorParsed = error instanceof Error ? error : new Error(String(error));
    return [null, errorParsed as E];
};

const isPromise = <T = any>(value: unknown): value is Promise<T> => {
    return (
        !!value &&
        (typeof value === 'object' || typeof value === 'function') &&
        typeof (value as any).then === 'function'
    );
}

// // ---------------------------
// // Testing
// // ---------------------------

// const main = async () => {
//     const syncCallback = () => 'data';
//     const asyncCallback = async () => {throw new Error('error message')};
//     const promise = new Promise<string>((resolve) => resolve('data'));

//     const [syncCallbackResult, syncCallbackError] = trycatch(syncCallback);
//     const [asyncCallbackResult, asyncCallbackError] = await trycatch(asyncCallback);
//     const [promiseResult, promiseError] = await trycatch(promise);

//     console.log(asyncCallbackResult)
//     console.log(asyncCallbackError?.message)
// };
