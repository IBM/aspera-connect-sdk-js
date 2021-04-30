import { ConnectStatus, ConnectEvent, TransferStatus, HttpMethod } from '../core/types';

export const MIN_SECURE_VERSION = '3.9.0';
export const HTTP_METHOD: HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  DELETE: 'DELETE',
  REVERT: 'REVERT'
};

export const STATUS: ConnectStatus = {
  INITIALIZING: 'INITIALIZING',
  RETRYING: 'RETRYING',
  RUNNING: 'RUNNING',
  OUTDATED: 'OUTDATED',
  FAILED: 'FAILED',
  EXTENSION_INSTALL: 'EXTENSION_INSTALL',
  STOPPED: 'STOPPED',
  WAITING: 'WAITING',
  DEGRADED: 'DEGRADED'
};

export const EVENT: ConnectEvent = {
  ALL: 'all',
  TRANSFER: 'transfer',
  STATUS: 'status'
};

export const TRANSFER_STATUS: TransferStatus = {
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  FAILED: 'failed',
  INITIATING: 'initiating',
  QUEUED: 'queued',
  REMOVED: 'removed',
  RUNNING: 'running',
  WILLRETRY: 'willretry'
};
