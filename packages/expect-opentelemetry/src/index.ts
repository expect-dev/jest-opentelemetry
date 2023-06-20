import {
  toReceiveHttpRequest,
  toSendHttpRequest,
  toQueryPostgreSQL,
  toReceiveGrpcRequest,
  toSendGrpcRequest,
  toSendRedisCommand,
} from './matchers/service';
import { expect } from '@jest/globals';
import {
  GrpcRequest,
  HttpRequest,
  PostgreSQLQuery,
  RedisCommand,
  Service,
} from './resources';
export { setDefaultOptions, getDefaultOptions } from './options';

export * from './matchers';
export * from './resources';
export * from './trace-loop';

const serviceMatchers = {
  toReceiveHttpRequest,
  toSendHttpRequest,
  toQueryPostgreSQL,
  toReceiveGrpcRequest,
  toSendGrpcRequest,
  toSendRedisCommand,
};

interface MatcherOptions {
  times: number;
}

interface TraceMatchers {
  toReceiveHttpRequest(): HttpRequest;
  toSendHttpRequest(): HttpRequest;
  toQueryPostgreSQL(options?: MatcherOptions): PostgreSQLQuery;
  toReceiveGrpcRequest(): GrpcRequest;
  toSendGrpcRequest(): GrpcRequest;
  toSendRedisCommand(options?: MatcherOptions): RedisCommand;
}

function createMatcher(matcher, type) {
  return function throwingMatcher(...args) {
    if (typeof expect !== 'undefined') {
      expect.getState().assertionCalls += 1;
    }

    try {
      return matcher(type, ...args);
    } catch (error: any) {
      Error.captureStackTrace(error, throwingMatcher);
      throw error;
    }
  };
}

export function expectTrace(actual: Service): TraceMatchers {
  const expectation: Partial<TraceMatchers> = {};
  Object.keys(serviceMatchers).forEach((key) => {
    if (key === 'not') return;
    expectation[key] = createMatcher(serviceMatchers[key], actual);
  });

  return expectation as TraceMatchers;
}
