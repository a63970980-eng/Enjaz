import posthog from 'posthog-js';
import type { CaptureResult, PostHogConfig } from 'posthog-js';

/**
 * Consent-gated PostHog client for the ENJAZ Workspace portal.
 *
 * Contract (see posthog-analytics.md):
 * - Off until a member explicitly grants analytics consent; no decision means off.
 * - Missing project token or host is a silent no-op.
 * - Only allowlisted product properties leave the browser, and a before_send hook
 *   rebuilds every event so no URL, referrer or person metadata survives.
 * - Every SDK call is guarded: analytics must never change a product result.
 */

export type AnalyticsConsent = 'granted' | 'denied' | 'unset';

export type AnalyticsStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type AnalyticsClient = {
  init?: (token: string, config: Partial<PostHogConfig>) => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (distinctId: string) => void;
  reset: () => void;
  opt_in_capturing: () => void;
  opt_out_capturing: () => void;
};

export type AnalyticsEventInput = {
  workspaceId?: unknown;
  roleCode?: unknown;
  toolCount?: unknown;
  objectiveLength?: unknown;
  taskStatus?: unknown;
  decision?: unknown;
  surface?: unknown;
};

export const ANALYTICS_CONSENT_STORAGE_KEY = 'ENJAZ_ANALYTICS_CONSENT';
export const POSTHOG_PROJECT_TOKEN_ENV = 'VITE_POSTHOG_PROJECT_TOKEN';
export const POSTHOG_HOST_ENV = 'VITE_POSTHOG_HOST';
export const ANALYTICS_EVENTS = {
  employeeCreated: 'employee_created',
  taskCreated: 'task_created',
  taskRunStarted: 'task_run_started',
  approvalDecided: 'approval_decided',
} as const;

const ALLOWED_PROPERTY_KEYS = [
  'workspace_id',
  'role_code',
  'tool_count',
  'objective_length_bucket',
  'task_status',
  'decision',
  'surface',
];
const ALLOWED_PROPERTY_KEY_SET = new Set(ALLOWED_PROPERTY_KEYS);
const SAFE_TOKEN = /^[A-Za-z0-9_.:-]+$/;
const OPAQUE_ID = /^[A-Za-z0-9_-]{8,64}$/;
const SENSITIVE_VALUE = /[@\s]|phc_|phx_|sk_|pk_|sb_|bearer|password|secret/i;
const TASK_STATUSES = ['queued', 'planning', 'executing', 'awaiting_approval'];
const SURFACES = ['employee_builder', 'task_board'];
const INGESTION_HOST = /^https:\/\/[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?$/i;

let client: AnalyticsClient | null = null;
let activeToken = '';
let consent: AnalyticsConsent = 'unset';

function browserStorage(): AnalyticsStorage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function envValue(name: string): string {
  const env = (import.meta as unknown as { env?: Record<string, unknown> }).env;
  const value = env ? env[name] : undefined;
  return typeof value === 'string' ? value.trim() : '';
}

export function readAnalyticsConsent(storage: AnalyticsStorage | null = browserStorage()): AnalyticsConsent {
  if (!storage) return 'unset';
  try {
    const stored = storage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    return stored === 'granted' || stored === 'denied' ? stored : 'unset';
  } catch {
    return 'unset';
  }
}

export function resolveAnalyticsConfig(source: { token?: unknown; host?: unknown } = {}): { token: string; host: string } | null {
  const token = (typeof source.token === 'string' ? source.token.trim() : envValue(POSTHOG_PROJECT_TOKEN_ENV));
  const host = (typeof source.host === 'string' ? source.host.trim() : envValue(POSTHOG_HOST_ENV));
  if (!token || !host) return null;
  // A public project token only; personal (phx_) and secret keys must never reach a bundle.
  if (/^phx_|^sk_/i.test(token) || !SAFE_TOKEN.test(token)) return null;
  if (!INGESTION_HOST.test(host)) return null;
  return { token, host };
}

/** The public project token comes from configuration, not from user data; keep it for delivery. */
function deliveryToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text || text.length > 200 || !SAFE_TOKEN.test(text)) return undefined;
  return text;
}

function safeValue(value: unknown): string | number | boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) && Math.abs(value) <= 1_000_000 ? Math.trunc(value) : undefined;
  }
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  if (!text || text.length > 64 || SENSITIVE_VALUE.test(text) || !SAFE_TOKEN.test(text)) return undefined;
  return text;
}

export function scrubAnalyticsEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event || typeof event !== 'object') return null;
  const source = (event.properties || {}) as Record<string, unknown>;
  const properties: Record<string, unknown> = {};
  const token = deliveryToken(source.token);
  if (token) properties.token = token;
  for (const key of Object.keys(source)) {
    if (!ALLOWED_PROPERTY_KEY_SET.has(key)) continue;
    const value = safeValue(source[key]);
    if (value !== undefined) properties[key] = value;
  }
  const scrubbed = { ...event, properties } as CaptureResult & Record<string, unknown>;
  delete scrubbed.$set;
  delete scrubbed.$set_once;
  return scrubbed;
}

function buildProperties(input: AnalyticsEventInput): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const workspaceId = safeValue(input.workspaceId);
  if (typeof workspaceId === 'string' && OPAQUE_ID.test(workspaceId)) properties.workspace_id = workspaceId;
  const roleCode = safeValue(input.roleCode);
  if (typeof roleCode === 'string') properties.role_code = roleCode;
  const toolCount = safeValue(input.toolCount);
  if (typeof toolCount === 'number' && toolCount >= 0) properties.tool_count = toolCount;
  if (input.objectiveLength !== undefined) {
    const length = Number(input.objectiveLength);
    if (Number.isFinite(length) && length > 0) {
      properties.objective_length_bucket = length <= 160 ? 'short' : length <= 600 ? 'medium' : 'long';
    }
  }
  const taskStatus = safeValue(input.taskStatus);
  if (typeof taskStatus === 'string' && TASK_STATUSES.includes(taskStatus)) properties.task_status = taskStatus;
  const decision = safeValue(input.decision);
  if (decision === 'approve' || decision === 'reject') properties.decision = decision;
  const surface = safeValue(input.surface);
  if (typeof surface === 'string' && SURFACES.includes(surface)) properties.surface = surface;
  return properties;
}

export function applyAnalyticsConsent(decision: AnalyticsConsent): void {
  consent = decision;
  if (!client) return;
  try {
    if (decision === 'granted') client.opt_in_capturing();
    else client.opt_out_capturing();
  } catch {
    // Consent application must never break the portal.
  }
}

/** Persists the member's decision and applies it to the live client. */
export function setAnalyticsConsent(decision: 'granted' | 'denied', storage: AnalyticsStorage | null = browserStorage()): void {
  try {
    storage?.setItem(ANALYTICS_CONSENT_STORAGE_KEY, decision);
  } catch {
    // Storage may be unavailable (private mode); the in-memory decision still applies.
  }
  applyAnalyticsConsent(decision);
  if (decision === 'denied') resetAnalyticsIdentity();
}

export function initAnalytics(options: { client?: AnalyticsClient; token?: string; host?: string; storage?: AnalyticsStorage | null } = {}): boolean {
  const config = resolveAnalyticsConfig(options);
  if (!config) return false;
  const target = options.client ?? (posthog as unknown as AnalyticsClient);
  if (typeof target?.init !== 'function') return false;
  if (client && activeToken === config.token) {
    // A repeated mount (React StrictMode) reuses the single client instead of re-initialising it.
    applyAnalyticsConsent(readAnalyticsConsent(options.storage ?? browserStorage()));
    return true;
  }
  try {
    target.init(config.token, {
      api_host: config.host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      capture_dead_clicks: false,
      capture_exceptions: false,
      disable_session_recording: true,
      disable_surveys: true,
      enable_heatmaps: false,
      advanced_disable_flags: true,
      person_profiles: 'never',
      opt_out_capturing_by_default: true,
      before_send: scrubAnalyticsEvent,
    });
    client = target;
    activeToken = config.token;
  } catch {
    client = null;
    activeToken = '';
  }
  if (!client) return false;
  applyAnalyticsConsent(readAnalyticsConsent(options.storage ?? browserStorage()));
  return true;
}

export function captureAnalyticsEvent(event: string, properties: Record<string, unknown>): boolean {
  if (!client || consent !== 'granted') return false;
  try {
    client.capture(event, scrubAnalyticsEvent({ event, properties } as CaptureResult)?.properties || {});
    return true;
  } catch {
    return false;
  }
}

export function identifyAnalyticsUser(identifier: unknown): boolean {
  const id = safeValue(identifier);
  if (!client || consent !== 'granted' || typeof id !== 'string' || !OPAQUE_ID.test(id)) return false;
  try {
    client.identify(id);
    return true;
  } catch {
    return false;
  }
}

export function resetAnalyticsIdentity(): void {
  try {
    client?.reset();
  } catch {
    // Reset is best effort.
  }
}

export const analytics = {
  employeeCreated(input: AnalyticsEventInput = {}): boolean {
    return captureAnalyticsEvent(ANALYTICS_EVENTS.employeeCreated, buildProperties({ ...input, surface: 'employee_builder' }));
  },
  taskCreated(input: AnalyticsEventInput = {}): boolean {
    return captureAnalyticsEvent(ANALYTICS_EVENTS.taskCreated, buildProperties(input));
  },
  taskRunStarted(input: AnalyticsEventInput = {}): boolean {
    return captureAnalyticsEvent(ANALYTICS_EVENTS.taskRunStarted, buildProperties(input));
  },
  approvalDecided(input: AnalyticsEventInput = {}): boolean {
    return captureAnalyticsEvent(ANALYTICS_EVENTS.approvalDecided, buildProperties(input));
  },
};
