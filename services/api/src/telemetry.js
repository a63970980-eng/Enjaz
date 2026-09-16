import { context, trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('enjaz-api');

export async function withSpan(name, attributes, operation) {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    const started = Date.now();
    try {
      const result = await context.with(trace.setSpan(context.active(), span), operation);
      span.setAttribute('enjaz.duration_ms', Date.now() - started);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setAttribute('enjaz.duration_ms', Date.now() - started);
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error?.message || String(error) });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function getTraceId() {
  const span = trace.getActiveSpan();
  return span?.spanContext()?.traceId || null;
}
