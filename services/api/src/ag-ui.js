import { EventSchemas, EventType } from '@ag-ui/core';

/**
 * ENJAZ -> AG-UI protocol bridge.
 *
 * Runtime events are validated before they leave the API so the workspace UI
 * can consume a stable agent lifecycle regardless of the underlying model.
 */
export function validateAgentEvent(event) {
  return EventSchemas.parse(event);
}

export function runStarted(runId, threadId) {
  return validateAgentEvent({
    type: EventType.RUN_STARTED,
    runId,
    threadId,
  });
}

export function textMessageStart(messageId, role = 'assistant') {
  return validateAgentEvent({
    type: EventType.TEXT_MESSAGE_START,
    messageId,
    role,
  });
}

export function textMessageContent(messageId, delta) {
  return validateAgentEvent({
    type: EventType.TEXT_MESSAGE_CONTENT,
    messageId,
    delta,
  });
}

export function textMessageEnd(messageId) {
  return validateAgentEvent({
    type: EventType.TEXT_MESSAGE_END,
    messageId,
  });
}

export function toolCallStart(toolCallId, toolCallName) {
  return validateAgentEvent({
    type: EventType.TOOL_CALL_START,
    toolCallId,
    toolCallName,
  });
}

export function toolCallArgs(toolCallId, delta) {
  return validateAgentEvent({
    type: EventType.TOOL_CALL_ARGS,
    toolCallId,
    delta,
  });
}

export function toolCallEnd(toolCallId) {
  return validateAgentEvent({
    type: EventType.TOOL_CALL_END,
    toolCallId,
  });
}

export function runFinished(runId, threadId) {
  return validateAgentEvent({
    type: EventType.RUN_FINISHED,
    runId,
    threadId,
  });
}

export function runError(runId, threadId, message) {
  return validateAgentEvent({
    type: EventType.RUN_ERROR,
    runId,
    threadId,
    message,
  });
}
