interface ErrorHandlers {
  handleInvalid: () => Error;
  handleMissing: () => Error;
  handleUnsupported: () => Error;
}

const defaultErrors: ErrorHandlers = {
  handleInvalid: () => new Error('invalid'),
  handleMissing: () => new Error('missing'),
  handleUnsupported: () => new Error('unsupported'),
};

function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

function wrapError(err: unknown, prefix: string): never {
  const _err = new Error();
  for (const key of Object.getOwnPropertyNames(err)) {
    (_err as unknown as Record<string, unknown>)[key] = (err as unknown as Record<string, unknown>)[key];
  }
  _err.message = `${prefix} -> ${(err as Error).message}`;
  throw _err;
}

function validateErrorHandlers(handlers: ErrorHandlers): void {
  if (typeof handlers.handleInvalid !== 'function') {
    const _err = new Error('missing');
    _err.message = 'handleInvalid -> missing';
    throw _err;
  }
  if (typeof handlers.handleMissing !== 'function') {
    const _err = new Error('missing');
    _err.message = 'handleMissing -> missing';
    throw _err;
  }
  if (typeof handlers.handleUnsupported !== 'function') {
    const _err = new Error('missing');
    _err.message = 'handleUnsupported -> missing';
    throw _err;
  }
}

type ValidationShape<T> = {
  [K in keyof T]: (value: unknown) => value is T[K];
};

function createObjectValidator<T extends Record<string, unknown>>(
  strict: boolean,
  errors: ErrorHandlers,
  shape: ValidationShape<T>,
): (value: unknown) => void {
  const shapeKeys = Object.keys(shape);

  for (const key of shapeKeys) {
    if (!isFunction(shape[key as keyof T])) {
      throw new Error(`predicate for ${key} is not a function`);
    }
  }

  return (value: unknown): void => {
    if (value === undefined) {
      throw errors.handleMissing();
    }

    const tag = Object.prototype.toString.call(value);
    if (tag !== '[object Object]' && tag !== '[object Error]') {
      throw errors.handleInvalid();
    }

    const obj = value as Record<string, unknown>;

    if (strict) {
      for (const key of Object.keys(obj)) {
        if (!shapeKeys.includes(key)) {
          try {
            throw errors.handleUnsupported();
          } catch (err) {
            wrapError(err, key);
          }
        }
      }
    }

    for (const key of shapeKeys) {
      const val = obj[key];
      const predicate = shape[key as keyof T];
      try {
        if (!predicate(val)) {
          throw errors.handleInvalid();
        }
      } catch (err) {
        wrapError(err, key);
      }
    }
  };
}

interface JCVDModule {
  isObjectOf: <T extends Record<string, unknown>>(shape: ValidationShape<T>) => (value: unknown) => value is T;
  isPartialObjectOf: <T extends Record<string, unknown>>(shape: ValidationShape<T>) => (value: unknown) => value is T;
  isArrayOf: <T>(predicate: (value: unknown) => value is T) => (value: unknown) => value is T[];
  isRequired: <T>(predicate: (value: unknown) => value is T) => (value: unknown) => value is T;
  isOptional: <T>(predicate: (value: unknown) => value is T) => (value: unknown) => value is T | undefined;
  label: <T>(name: string, predicate: (value: unknown) => value is T) => (value: unknown) => value is T;
  customErrors: (handlers: { handleInvalid?: () => Error; handleMissing?: () => Error }) => JCVDModule;
}

function makeModule(errors: ErrorHandlers): JCVDModule {
  return {
    isObjectOf: <T extends Record<string, unknown>>(shape: ValidationShape<T>): ((value: unknown) => value is T) => {
      const validate = createObjectValidator(true, errors, shape);
      return (value: unknown): value is T => {
        validate(value);
        return value as unknown as boolean;
      };
    },

    isPartialObjectOf: <T extends Record<string, unknown>>(shape: ValidationShape<T>): ((value: unknown) => value is T) => {
      const validate = createObjectValidator(false, errors, shape);
      return (value: unknown): value is T => {
        validate(value);
        return value as unknown as boolean;
      };
    },

    isArrayOf: <T>(predicate: (value: unknown) => value is T): ((value: unknown) => value is T[]) => {
      if (!isFunction(predicate)) {
        throw new Error('predicate is not a function');
      }

      return (value: unknown): value is T[] => {
        if (value === undefined) {
          throw errors.handleMissing();
        }
        if (!Array.isArray(value)) {
          throw errors.handleInvalid();
        }

        const arr = value as unknown[];
        for (let i = 0; i < arr.length; i++) {
          try {
            if (!predicate(arr[i])) {
              throw errors.handleInvalid();
            }
          } catch (err) {
            wrapError(err, `[${i}]`);
          }
        }

        return true;
      };
    },

    isRequired: <T>(predicate: (value: unknown) => value is T): ((value: unknown) => value is T) => {
      if (!isFunction(predicate)) {
        throw new Error('predicate is not a function');
      }

      return (value: unknown): value is T => {
        if (value === undefined || value === null) {
          throw errors.handleMissing();
        }
        return predicate(value);
      };
    },

    isOptional: <T>(predicate: (value: unknown) => value is T): ((value: unknown) => value is T | undefined) => {
      if (!isFunction(predicate)) {
        throw new Error('predicate is not a function');
      }

      return (value: unknown): value is T | undefined => {
        if (value === undefined || value === null) {
          return true;
        }
        return predicate(value);
      };
    },

    label: <T>(name: string, predicate: (value: unknown) => value is T): ((value: unknown) => value is T) => {
      if (!isFunction(predicate)) {
        throw new Error('predicate is not a function');
      }

      return (value: unknown): value is T => {
        try {
          if (predicate(value)) {
            return value as unknown as boolean;
          }
          throw errors.handleInvalid();
        } catch (err) {
          wrapError(err, name);
        }
      };
    },

    customErrors: (handlers: { handleInvalid?: () => Error; handleMissing?: () => Error }): JCVDModule => {
      const merged: ErrorHandlers = {
        ...errors,
        ...handlers,
      };
      validateErrorHandlers(merged);
      return makeModule(merged);
    },
  };
}

const jcvd = makeModule(defaultErrors);

export const {
  isObjectOf,
  isPartialObjectOf,
  isArrayOf,
  isRequired,
  isOptional,
  label,
  customErrors,
} = jcvd;
