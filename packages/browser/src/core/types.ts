export interface Globals {
  /** Shared running Connect version */
  connectVersion: string;
  /** Shared min version requirenent */
  minVersion: string;
  /** DEPRECATED: Shared session id */
  sessionId: string;
  /** DEPRECATED: Shared session key */
  sessionKey: string;
}

export interface InstallerOptions {
  sdkLocation?: string;
  stylesheetLocation?: string;
  iframeId?: string;
  iframeClass?: string;
  style?: string;
  correlationId?: string;
  useFips?: boolean;
}

export interface GetChecksumOptions {
  path: string;
  offset?: number;
  chunkSize?: number;
  checksumMethod?: 'md5' | 'sha1' | 'sha256' | 'sha512';
}

export type ExtensionPartialRequest = Pick<HttpEndpoint, 'method' | 'body'>;

export interface ExtensionRequest extends ExtensionPartialRequest {
  request_id: number;
  min_version: string;
  uri_reference: string;
  timeout?: number;
}

export interface ExtensionRequestInfo {
  req: ExtensionRequest;
  response: string;
  /** Resolve function to return the response */
  resolve: (value?: HttpResponse | PromiseLike<HttpResponse> | undefined) => void;
}

export interface RequestInfo
  extends HttpEndpoint {
  requestId: number;
  /** Resolve function to return the response */
  resolve?: Function;
  reject?: Function;
}

export interface RequestInfoHash<T> {
  [key: string]: T;
}

export interface DetectionCallbacks {
  success (): any;
  timedout (): any;
}

export interface ExtensionProvider {
  isSupportedByBrowser (): boolean;
  detectExtension (timeoutMs: number, callbacks: DetectionCallbacks): void;
  stop (): void;
}

export interface HttpEndpoint {
  /** GET or POST */
  method: string;
  /** API endpoint */
  path: string;
  /** POST data */
  body?: string | undefined;
}

export interface Provider {
  /** Returns an instance of the selected request implementation class. */
  getStrategy (): Promise<RequestStrategy>;
  /** Returns an instance of the http request implementation class */
  getHttpStrategy (): RequestStrategy;
}

export interface RequestStrategy {
  name: string;
  /** Send HTTP request */
  httpRequest (endpoint: HttpEndpoint, requestId: number): Promise<ResolvedHttpResponse>;
  /** Launch and detect Connect and also detect extension if applicable */
  startup (): Promise<void | ConnectError>;
  /** Change handler status to stopped */
  stop? (): void;
  /** Detect if extension is installed */
  detectExtension? (timeout?: number): Promise<boolean>;
}

export interface RequestHandlerOptions
  extends ToRequire<ConfigurationOptionsSubset> {
  extensionRequestTimeout?: number;
  objectId: number;
    /** Change Connect status callback */
  statusListener: (status: string) => void;
}

export interface RequestStrategyOptions extends RequestHandlerOptions {
  /** changeConnectStatus callback */
  requestStatusCallback (status: string): void;
}

/** Request implementation to handle requests */
export interface RequestHandler {
  /**
   * Starts a new API request
   */
  start <T> (endpoint: HttpEndpoint): Promise<T>;

  /**
   * Initializes the request handler and implementation
   */
  init (): Promise<void>;

  stopRequests (): void;
}

/** Convert optional keys to required */
type ToRequire<T> = {
  [K in keyof T]-?: T[K];
};

type ConfigurationOptionsSubset =
  Pick<ConfigurationOptions,
    'id' |
    'containerId' |
    'connectLaunchWaitTimeoutMs' |
    'sdkLocation' |
    'connectMethod' |
    'minVersion'
  >;

export interface ApiClass {
  /**
   * Sends API request
   */
  send <T> (request: any): Promise<T>;
}

type PageNames =
  'general' |
  'transfers' |
  'network' |
  'bandwidth' |
  'security';

export interface PromiseInfo {
  resolve: Function;
  reject: Function;
}

export interface PreferencesOptions {
  page: PageNames;
}

interface DialogOptions {
  /** Filter the files displayed by file extension. */
  allowedFileTypes?: any;
  /** The filename to pre-fill the dialog with. */
  suggestedName?: string;
  /** The name of the dialog window. */
  title?: string;
}

export interface SaveFileDialogOptions extends DialogOptions {}
export interface SelectFileDialogOptions extends DialogOptions {
  /** Allow the selection of multiple files. */
  allowMultipleSelection?: boolean;
}

export type SelectFolderDialogOptions = Pick<SelectFileDialogOptions, 'title' | 'allowMultipleSelection'>;

export interface DataTransfer {
  /** Object returned only on drop event */
  dataTransfer: {
    files: FileObject[]
  };
}

export interface TestSshPortsOptions {
  /** Domain name of the transfer server */
  remote_host: string;
  /** SSH port */
  ssh_port?: number;
  /** Timeout value in seconds */
  timeout_sec?: number;
}

type FileObject = {
  /** Last modified timestamp of file */
  lastModifiedDate: string,
  /** Absolute path to file */
  name: string,
  /** Size of file */
  size: number,
  /** Content type of file */
  type: string
};

export interface DragDropOptions {
  dragEnter?: boolean;
  dragOver?: boolean;
  dragLeave?: boolean;
  drop?: boolean;
  allowPropagation?: boolean;
}

interface DragDropEvent {
  /** DOM Event object as implemented by the browser. */
  event: DragEvent;
  /** Object that holds the data of the files that have been dropped by the user. */
  files?: DataTransfer;
}

export interface DragDropListener {
  (result: DragDropEvent): void;
}

/** Connect event type  */
export type EventString = 'transfer' | 'status' | 'all';

/** Listener called when Connect event received */
export interface EventListener {
  (eventType: EventString, data: any): void;
}

export interface ConnectEvent {
  ALL: 'all';
  TRANSFER: 'transfer';
  STATUS: 'status';
}

export type ConnectStatusStrings =
'INITIALIZING' |
'RETRYING' |
'RUNNING' |
'OUTDATED' |
'FAILED' |
'EXTENSION_INSTALL' |
'STOPPED' |
'WAITING' |
'DEGRADED';
export type ConnectStatus = { [k in ConnectStatusStrings]: k };

export interface HttpMethod {
  GET: 'GET';
  POST: 'POST';
  DELETE: 'DELETE';
  REVERT: 'REVERT';
}

export interface TransferStatus {
  CANCELLED: 'cancelled';
  COMPLETED: 'completed';
  FAILED: 'failed';
  INITIATING: 'initiating';
  QUEUED: 'queued';
  REMOVED: 'removed';
  RUNNING: 'running';
  WILLRETRY: 'willretry';
}

export interface LogLevels {
  INFO: 0;
  DEBUG: 1;
  TRACE: 2;
}

interface FilePaths {
  /** Path to source file */
  source: string;
  /** Path to destination file */
  destination?: string;
}

/**
 * NOTE: Type inference causes compiler error in downstream uses of TransferSpec
 * if literal strings types are used. For easier integration just use general
 * string type instead.
 */

/** Transfer options */
export interface TransferSpec {
  direction: string;
  paths: FilePaths[];
  remote_host: string;
  authentication?: string;
  cipher?: string;
  content_protection?: boolean;
  content_protection_passphrase?: string;
  cookie?: string;
  create_dir?: boolean;
  destination_root?: string;
  dgram_size?: number;
  fasp_port?: number;
  http_fallback?: boolean;
  http_fallback_port?: number;
  lock_min_rate?: boolean;
  lock_rate_policy?: boolean;
  lock_target_rate?: boolean;
  min_rate_kbps?: number;
  rate_policy?: string;
  remote_password?: string;
  remote_user?: string;
  resume?: string;
  source_root?: string;
  ssh_port?: number;
  target_rate_cap_kbps?: number;
  target_rate_kbps?: number;
  token?: string;
}

export interface TransferObject {
  transfer_spec: TransferSpec;
  aspera_connect_settings: ConnectSpec;
  authorization_key?: string;
}

export interface TransferSpecs {
  transfer_specs: TransferObject[];
}

/**
 * Respone returned by request implementation
 */
export interface ResolvedHttpResponse {
  /** Status code */
  status: number;
  /** Response body */
  body: string;
  /** id of request for tracking purposes */
  requestId: number;
}

/**
 * Object returned by APi call
 */
export type HttpResponse = any;

/**
 * Object that can be passed to an API call to get the results
 * of the call.
 */
export interface Callbacks<T> {
  /** Function called on successful response */
  success? (response: T): void;
  /** Function called if request returns error */
  error? (error: ConnectError): void;
}

/**
 * Represents the object returned if an error occurs.
 */
export interface ConnectError {
  error: {
    code: number,
    internal_message: string,
    user_message: string
  };
}

export interface ApplicationIdObject {
  app_id: string;
}

/** Connect web app parameters */
export interface ConnectSpec {
  back_link?: string;
  return_paths?: boolean;
  return_files?: boolean;
  allow_dialogs?: boolean;
  use_absolute_destination_path?: boolean;
}

export interface ConnectSettings
  extends ConnectSpec {
  app_id: string;
  request_id: string;
}

/** Connect SDK interface */
export interface ConnectClient {
  addEventListener (type: EventString, listener: EventListener): void | ConnectError;

  /**
   * Test authentication credentials against a transfer server.
   */
  authenticate (authSpec: Partial<TransferSpec>, callbacks: Callbacks<{}>): void;
  authenticate (authSpec: Partial<TransferSpec>): Promise<{}>;
  authenticate (authSpec: Partial<TransferSpec>, callbacks?: Callbacks<{}>): void | Promise<{}>;

  getAllTransfers (callbacks: Callbacks<AllTransfersInfo>, iterationToken?: number): void;
  getAllTransfers (callbacks: Callbacks<AllTransfersInfo>, iterationToken?: number): void | Promise<AllTransfersInfo>;

  getTransfer (transferId: string, callbacks: Callbacks<{ transfer_info: TransferInfo }>): void;
  getTransfer (transferId: string): Promise<{ transfer_info: TransferInfo }>;
  getTransfer (transferId: string, callbacks?: Callbacks<{ transfer_info: TransferInfo }>): void | Promise<{ transfer_info: TransferInfo }>;

  getStatus (): ConnectStatusStrings;
  initSession (id?: string): ApplicationIdObject | ConnectError;

  modifyTransfer (transferId: string, options: Partial<TransferSpec>, callbacks: Callbacks<{}>): void;
  modifyTransfer (transferId: string, options: Partial<TransferSpec>): Promise<{}>;
  modifyTransfer (transferId: string, options: Partial<TransferSpec>, callbacks?: Callbacks<{}>): void | Promise<{}>;

  readAsArrayBuffer (options: { path: string }, callbacks: Callbacks<ArrayBufferOutput>): void;
  readAsArrayBuffer (options: { path: string }): Promise<ArrayBufferOutput>;
  readAsArrayBuffer (options: { path: string }, callbacks?: Callbacks<ArrayBufferOutput>): void | Promise<ArrayBufferOutput>;

  readChunkAsArrayBuffer (
    options: { path: string, offset: number, chunkSize: number },
    callbacks: Callbacks<ArrayBufferOutput>
  ): void;
  readChunkAsArrayBuffer (
    options: { path: string, offset: number, chunkSize: number }
  ): Promise<ArrayBufferOutput>;
  readChunkAsArrayBuffer (
    options: { path: string, offset: number, chunkSize: number },
    callbacks?: Callbacks<ArrayBufferOutput>
  ): void | Promise<ArrayBufferOutput>;

  getChecksum (options: GetChecksumOptions, callbacks: Callbacks<ChecksumFileOutput>): void;
  getChecksum (options: GetChecksumOptions): Promise<ChecksumFileOutput>;
  getChecksum (options: GetChecksumOptions, callbacks?: Callbacks<ChecksumFileOutput>): void | Promise<ChecksumFileOutput>;

  removeEventListener (type?: EventString, listener?: EventListener): boolean;

  removeTransfer (transferId: string, callbacks: Callbacks<{}>): void;
  removeTransfer (transferId: string): Promise<{}>;
  removeTransfer (transferId: string, callbacks?: Callbacks<{}>): void | Promise<{}>;

  resumeTransfer (
    transferId: string,
    options: Partial<TransferSpec>,
    callbacks: Callbacks<ResumeTransferOutput>
  ): void;
  resumeTransfer (
    transferId: string,
    options: Partial<TransferSpec>
  ): Promise<ResumeTransferOutput>;
  resumeTransfer (
    transferId: string,
    options: Partial<TransferSpec>,
    callbacks?: Callbacks<ResumeTransferOutput>
  ): void | Promise<ResumeTransferOutput>;

  setDragDropTargets (
    cssSelector: string,
    options: DragDropOptions,
    listener: DragDropListener
  ): void | ConnectError;

  showAbout (callbacks: Callbacks<{}>): void;
  showAbout (): Promise<{}>;
  showAbout (callbacks?: Callbacks<{}>): void | Promise<{}>;

  showDirectory (transferId: string, callbacks: Callbacks<{}>): void;
  showDirectory (transferId: string): Promise<{}>;
  showDirectory (transferId: string, callbacks?: Callbacks<{}>): void | Promise<{}>;

  showPreferences (callbacks: Callbacks<{}>): void;
  showPreferences (): Promise<{}>;
  showPreferences (callbacks?: Callbacks<{}>): void | Promise<{}>;

  showPreferencesPage (options: PreferencesOptions, callbacks: Callbacks<{}>): void;
  showPreferencesPage (options: PreferencesOptions): Promise<{}>;
  showPreferencesPage (options: PreferencesOptions, callbacks?: Callbacks<{}>): void | Promise<{}>;

  showSaveFileDialog (callbacks: Callbacks<ShowSaveFileDialogOutput>, options?: SaveFileDialogOptions): void;

  showSelectFileDialog (callbacks: Callbacks<ShowSelectFileDialogOutput>, options?: SelectFileDialogOptions): void;
  showSelectFileDialogPromise (options?: SelectFileDialogOptions): Promise<ShowSelectFileDialogOutput>;

  showSelectFolderDialog (callbacks: Callbacks<ShowSelectFolderDialogOutput>, options?: SelectFolderDialogOptions): void;
  showSelectFolderDialogPromise (options?: SelectFolderDialogOptions): Promise<ShowSelectFolderDialogOutput>;

  showTransferManager (callbacks: Callbacks<{}>): void;
  showTransferManager (): Promise<{}>;
  showTransferManager (callbacks?: Callbacks<{}>): void | Promise<{}>;

  showTransferMonitor (transferId: string, callbacks: Callbacks<{}>): void;
  showTransferMonitor (transferId: string): Promise<{}>;
  showTransferMonitor (transferId: string, callbacks?: Callbacks<{}>): void | Promise<{}>;

  start (): void | ConnectError;

  startTransfer (
    transferSpec: TransferSpec,
    asperaConnectSettings: ConnectSpec,
    callbacks: Callbacks<StartTransferOutput>
  ): { request_id: string };

  startTransferPromise (transferSpec: TransferSpec, asperaConnectSettings: ConnectSpec): Promise<StartTransferOutput>;

  startTransfers (transferSpecs: TransferSpecs, callbacks: Callbacks<StartTransferOutput>): { request_id: string };
  startTransfers (transferSpecs: TransferSpecs): Promise<StartTransferOutput>;
  startTransfers (transferSpecs: TransferSpecs, callbacks?: Callbacks<StartTransferOutput>): { request_id: string } | Promise<StartTransferOutput>;

  stop (): void;

  stopTransfer (transferId: string, callbacks: Callbacks<{}>): void;
  stopTransfer (transferId: string): Promise<{}>;
  stopTransfer (transferId: string, callbacks?: Callbacks<{}>): void | Promise<{}>;

  testSshPorts (options: TestSshPortsOptions, callbacks: Callbacks<{}>): void;
  testSshPorts (options: TestSshPortsOptions): Promise<{}>;
  testSshPorts (options: TestSshPortsOptions, callbacks?: Callbacks<{}>): void | Promise<{}>;

  version (callbacks: Callbacks<VersionOutput>): void;
  version (): Promise<VersionOutput>;
  version (callbacks?: Callbacks<VersionOutput>): Promise<VersionOutput> | void;
}

export interface ResumeTransferOutput {
  transfer_spec: {
    aspera_connect_settings: ConnectSettings;
    tags: {
      aspera: {
        index: number;
        xfer_id: string;
        xfer_retry: string;
      }
    }
    transfer_spec: TransferSpec;
    uuid: string;
  };
}

export interface ArrayBufferOutput {
  type: string;
  data: string;
}

export interface ChecksumFileOutput {
  checksumMethod: 'md5' | 'sha1' | 'sha256' | 'sha512';
  checksum: string;
}

export interface DropEventOutput extends DragDropEvent {}

export interface ShowSaveFileDialogOutput extends DataTransfer {}

export interface ShowSelectFileDialogOutput extends DataTransfer {}

export interface ShowSelectFolderDialogOutput extends DataTransfer {}

export interface VersionOutput {
  /** Connect is installed system-wide or not. */
  system_wide: boolean;
  /** Connect application version */
  version: string;
}

export interface TransferOutput {
  aspera_connect_settings: ConnectSettings;
  transfer_spec: TransferSpec;
  /** Id of the transfer */
  uuid: string;
  tags: {
    aspera: {
      index: number;
      xfer_id: string;
      xfer_retry: number
    }
  };
}

export interface StartTransferOutput {
  transfer_specs: TransferOutput[];
}

/** Configuration settings for the Connect SDK. */
export interface ConfigurationOptions {
  /** How long to wait in ms for Connect to launch. */
  connectLaunchWaitTimeoutMs?: number;
  /** DOM id of the plug-in object to be inserted */
  id?: string;
  /** DOM id of an existing element to insert the plug-in into. */
  containerId?: string;
  /** Specifies custom SDK location to check for Connect installers. */
  sdkLocation?: string;
  /** How often in ms to get updates of a transfer's status. */
  pollingTime?: number;
  /** Minimum version of Connect required by the web application. */
  minVersion?: string;
  /** Enable drag and drop of files/folders into the browser. */
  dragDropEnabled?: boolean;
  authorizationKey?: string;
  /** Specify the preferred method of Connect communication. */
  connectMethod?: string;
  maxActivityOutstanding?: number;
  extensionRequestTimeout?: number;
}

export interface FileInfoObject {
  bytes_expected: number;
  bytes_written: number;
  fasp_file_id: string;
  file: string;
}

export interface TransferInfo {
  add_time: string;
  aspera_connect_settings: ConnectSettings;
  bytes_expected: number;
  bytes_written: number;
  calculated_rate_kbps: number;
  current_file: string;
  elapsed_usec: number;
  end_time: string;
  modify_time: string;
  percentage: number;
  previous_status: string;
  remaining_usec: number;
  start_time: string;
  status: string;
  title: string;
  transfer_iteration_token: number;
  transfer_spec: TransferSpec;
  transport: string;
  uuid: string;
  files: FileInfoObject[];
}

export interface AllTransfersInfo {
  iteration_token: number;
  result_count: number;
  transfers: TransferInfo[];
}
