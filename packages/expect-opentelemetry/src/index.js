/* eslint-disable no-use-before-define, no-restricted-syntax, no-await-in-loop */
import { getInstanceType } from './utils';
import { toRecieveHttpRequest } from './matchers/toRecieveHttpRequest';
import { toSendHttpRequest } from './matchers/toSendHttpRequest';

export { setDefaultOptions, getDefaultOptions } from './options';

const spanMatchers = {};

const serviceMatchers = {
  toRecieveHttpRequest,
  toSendHttpRequest,
};

function createMatcher(matcher, page) {
  return async function throwingMatcher(...args) {
    if (typeof global.expect !== 'undefined') {
      global.expect.getState().assertionCalls += 1;
    }

    try {
      return await matcher(page, ...args);
    } catch (error) {
      Error.captureStackTrace(error, throwingMatcher);
      throw error;
    }
  };
}

function internalExpect(type, matchers) {
  const expectation = {
    not: {},
  };

  Object.keys(matchers).forEach((key) => {
    if (key === 'not') return;
    expectation[key] = createMatcher(matchers[key], type);
  });

  Object.keys(matchers.not).forEach((key) => {
    expectation.not[key] = createMatcher(matchers.not[key], type);
  });

  return expectation;
}

function expectOpenTelemetry(actual) {
  const type = getInstanceType(actual);
  switch (type) {
    case 'Span':
      return internalExpect(actual, spanMatchers);
    case 'Service':
      return internalExpect(actual, serviceMatchers);
    default:
      throw new Error(`${actual} is not supported`);
  }
}

if (typeof global.expect !== 'undefined') {
  const originalExpect = global.expect;
  global.expect = (actual, ...args) => {
    const type = getInstanceType(actual);
    if (type) {
      const matchers = expectOpenTelemetry(actual);
      const jestMatchers = originalExpect(actual, ...args);
      return {
        ...jestMatchers,
        ...matchers,
        not: {
          ...jestMatchers.not,
          ...matchers.not,
        },
      };
    }
    return originalExpect(actual, ...args);
  };
  Object.keys(originalExpect).forEach((prop) => {
    global.expect[prop] = originalExpect[prop];
  });
}
