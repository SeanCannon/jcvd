let standardErrors = {
  handleInvalid     : () => new Error('invalid'),
  handleMissing     : () => new Error('missing'),
  handleUnsupported : () => new Error('unsupported')
};

const isObjectOf = strict => errors => schema => {
  const schemaKeys = Object.keys(schema);
  schemaKeys.forEach(key => {
    const predicate = schema[key];
    if (typeof predicate !== 'function') {
      throw new Error(`predicate for ${key} is not a function`);
    }
  });
  return obj => {
    if (obj === undefined) {
      throw errors.handleMissing();
    }
    if ((Object.prototype.toString.call(obj) !== '[object Object]') &&
      (Object.prototype.toString.call(obj) !== '[object Error]')) {
      throw errors.handleInvalid();
    }
    if (strict) {
      Object.keys(obj).forEach(key => {
        try {
          if (!schemaKeys.includes(key)) {
            throw errors.handleUnsupported();
          }
        } catch (err) {
          const _err = new Error();

          Object.getOwnPropertyNames(err).map(k => _err[k] = err[k]);
          _err.message = `${key} -> ${err.message}`;

          throw _err;
        }
      });
    }
    schemaKeys.forEach(key => {
      const value     = obj[key];
      const predicate = schema[key];
      try {
        if (predicate(value) === false) {
          throw errors.handleInvalid();
        }
      } catch (err) {
        const _err = new Error();

        Object.getOwnPropertyNames(err).map(k => _err[k] = err[k]);
        _err.message = `${key} -> ${err.message}`;

        throw _err;
      }
    });

    return true;
  };
};

const isArrayOf = errors => predicate => {
  if (typeof predicate !== 'function') {
    throw new Error('predicate is not a function');
  }
  return arr => {
    if (arr === undefined) {
      throw errors.handleMissing();
    }
    if (!Array.isArray(arr)) {
      throw errors.handleInvalid();
    }
    arr.forEach((value, i) => {
      try {
        if (predicate(value) === false) {
          throw errors.handleInvalid();
        }
      } catch (err) {
        const _err = new Error();

        Object.getOwnPropertyNames(err).map(k => _err[k] = err[k]);
        _err.message = `[${i}] -> ${err.message}`;

        throw _err;
      }
    });
    return true;
  };
};

const isRequired = errors => predicate => {
  if (typeof predicate !== 'function') {
    throw new Error('predicate is not a function');
  }
  return value => {
    if (value === undefined) {
      throw errors.handleMissing();
    } else {
      return predicate(value);
    }
  };
};

const isOptional = predicate => {
  if (typeof predicate !== 'function') {
    throw new Error('predicate is not a function');
  }
  return value => {
    if (typeof value === 'undefined' || value === null) {
      return true;
    } else {
      return predicate(value);
    }
  };
};

const label = (_label, predicate) => {
  if (typeof predicate !== 'function') {
    throw new Error('predicate is not a function');
  }
  return value => {
    try {
      return predicate(value) ? value : false;
    } catch (err) {
      const _err = new Error();

      Object.getOwnPropertyNames(err).map(k => _err[k] = err[k]);
      _err.message = `${_label} -> ${err.message}`;

      throw _err;
    }
  };
};

const isFunction = isRequired(standardErrors)(a => {
  if (typeof a !== 'function') {
    throw new Error('must be function');
  }
  return true;
});

const isCustomErrors = isObjectOf(false)(standardErrors)({
  handleInvalid     : isFunction,
  handleMissing     : isFunction,
  handleUnsupported : isFunction
});

module.exports = {
  isObjectOf        : isObjectOf(true)(standardErrors),
  isPartialObjectOf : isObjectOf(false)(standardErrors),
  isArrayOf         : isArrayOf(standardErrors),
  isRequired        : isRequired(standardErrors),
  isOptional,
  label,
  customErrors      : errors => {
    isCustomErrors(errors);
    return {
      isObjectOf        : isObjectOf(true)(errors),
      isPartialObjectOf : isObjectOf(false)(errors),
      isArrayOf         : isArrayOf(errors),
      isRequired        : isRequired(errors),
      isOptional,
      label
    };
  }
};
