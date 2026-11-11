/**
 * The File System Access API's types are only partly in TypeScript's DOM lib:
 * `FileSystemDirectoryHandle` exists, but the picker entry point and the two
 * permission methods do not. Declared here so the module needs no `any`.
 */

type FileSystemPermissionMode = 'read' | 'readwrite';

interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode;
}

interface FileSystemHandle {
  /** 'granted', 'prompt' or 'denied' — asked without prompting the owner. */
  queryPermission(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>;
  /** Asks the owner. Needs a user gesture, so it is only called from a click. */
  requestPermission(
    descriptor?: FileSystemHandlePermissionDescriptor
  ): Promise<PermissionState>;
}

type WellKnownDirectory =
  'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';

interface DirectoryPickerOptions {
  /** Reopens the picker where this id last chose, per origin. */
  id?: string;
  mode?: FileSystemPermissionMode;
  startIn?: FileSystemHandle | WellKnownDirectory;
}

interface Window {
  showDirectoryPicker(
    options?: DirectoryPickerOptions
  ): Promise<FileSystemDirectoryHandle>;
}
