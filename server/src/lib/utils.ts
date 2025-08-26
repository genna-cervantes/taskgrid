import { parse } from 'node-html-parser';

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

export const getDataIdFromComment = (htmlString: string) => {
  const root = parse(htmlString);
  const elementWithDataId = root.querySelector('[data-id]');
  const attr = elementWithDataId?.getAttribute('data-id')

  if (attr){
    return parseInt(attr)
  }

  return null;
};

export const toSnakeCase = (str: string) => str.replace(/([A-Z])/g, '_$1').toLowerCase();