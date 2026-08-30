import { createStore, del, entries, get, set } from "idb-keyval";
import type { FileSystemHandle, FileWithHandle } from "browser-fs-access";

const storage = createStore("web-dev-tools-files", "files");
type FileHandle = NonNullable<FileWithHandle["handle"]> & FileSystemHandle;
type StoredFile = File | FileHandle;

const fileHandles = new Map<string, FileHandle>();

const isFileHandle = (file: StoredFile): file is FileHandle => "getFile" in file;

const readFileHandle = async (handle: FileHandle) => {
	if (await handle.queryPermission({ mode: "read" }) !== "granted")
		throw new Error(`Access to ${handle.name} was not granted.`);
	return handle.getFile();
};

export const loadPersistentFiles = async (): Promise<void> => {
	fileHandles.clear();
	for (const [id, file] of await entries<string, StoredFile>(storage)) {
		if (isFileHandle(file))
			fileHandles.set(id, file);
	}
};

export const savePersistentFile = async (id: string, file: FileWithHandle): Promise<void> => {
	if (file.handle) {
		const handle = file.handle as FileHandle;
		try {
			await set(id, handle, storage);
			fileHandles.set(id, handle);
			return;
		} catch {
			// Fall back to storing the file when the browser cannot clone the handle.
		}
	}

	await set(id, file, storage);
	fileHandles.delete(id);
};

export const requestPersistentFilePermissions = async (ids: string[]): Promise<void> => {
	const handles = ids.map((id) => fileHandles.get(id)).filter((handle) => handle !== undefined);
	const permissions = await Promise.all(handles.map((handle) => handle.requestPermission({ mode: "read" })));

	for (let i = 0; i < permissions.length; i++) {
		if (permissions[i] !== "granted")
			throw new Error(`Access to ${handles[i].name} was not granted.`);
	}
};

export const readPersistentFile = async (id: string): Promise<File> => {
	const cachedHandle = fileHandles.get(id);
	if (cachedHandle)
		return readFileHandle(cachedHandle);

	const file = await get<StoredFile>(id, storage);
	if (!file)
		throw new Error("File was not found.");
	if (isFileHandle(file)) {
		fileHandles.set(id, file);
		return readFileHandle(file);
	}
	return file;
};

export const removePersistentFile = async (id: string): Promise<void> => {
	await del(id, storage);
	fileHandles.delete(id);
};
