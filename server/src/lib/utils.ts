type Success<T> = {
  data: T;
  error: null;
};

type Failure<E> = {
  data: null;
  error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
  promise: Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error as E };
  }
}

// export const toSnakeCase = (camelCase: string) => {
//   let camelArr = camelCase.split('');

//   camelArr = camelArr.map((c) => {
//     if (c === c.toUpperCase()){
//       return `_${c.toLowerCase()}`
//     }else{
//       return c
//     }
//   })

//   return camelArr.join('')
// }

export const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase();