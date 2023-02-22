import { opentelemetry } from '@traceloop/otel-proto';
import { setTimeout } from 'timers/promises';
import { httpGetBinary } from '../utils';

const TRACE_LOOP_ID_HEADER_OTEL_ATTRIBUTE = 'http.request.header.trace_loop_id';

export interface FetchTracesConfig {
  maxPollTime: number;
  pollInterval: number;
  awaitAllTracesTimeout: number;
  url: string;
}

export const fetchTracesConfigBase: FetchTracesConfig = {
  maxPollTime: 10000,
  pollInterval: 500,
  awaitAllTracesTimeout: 4000,
  url: 'http://localhost:4123/v1/traces',
};

/**
 * Searches in the traces for a trace with the given traceLoopId contained in the attribute http.request.header.trace_loop_id
 *
 * @param traces all traces from the otel receiver
 * @param traceLoopId traceLoopId to search for
 * @returns traceId of the span with the given traceLoopId or undefined if no match was found
 */
export const findTraceLoopIdMatch = (
  traces: opentelemetry.proto.trace.v1.TracesData,
  traceLoopId: string,
): string | undefined => {
  for (const resourceSpan of traces.resourceSpans) {
    for (const scopeSpan of resourceSpan.scopeSpans || []) {
      for (const span of scopeSpan.spans || []) {
        if (span.attributes) {
          for (const attribute of span.attributes) {
            if (attribute.key === TRACE_LOOP_ID_HEADER_OTEL_ATTRIBUTE) {
              if (
                attribute.value?.arrayValue?.values?.[0]?.stringValue ===
                traceLoopId
              ) {
                return span.traceId
                  ? Buffer.from(span.traceId).toString('hex')
                  : undefined;
              }
            }
          }
        }
      }
    }
  }
};

export const pollForTraceLoopIdMatch = async (
  config: FetchTracesConfig,
  traceLoopId: string,
): Promise<string | undefined> => {
  let foundMatch = false;
  while (!foundMatch) {
    await setTimeout(config.pollInterval);
    const response = await httpGetBinary(config.url);
    const traces = opentelemetry.proto.trace.v1.TracesData.decode(response);

    const traceId = findTraceLoopIdMatch(traces, traceLoopId);
    if (traceId) {
      foundMatch = true;
      return traceId;
    }
  }
};

export const resolveAfterTimeout = async (config: FetchTracesConfig) => {
  return new Promise((resolve, _) => {
    setTimeout(config.maxPollTime).then(() => {
      resolve(undefined);
    });
  });
};
