import type { FileWithHandle } from "browser-fs-access";
import type {
	Ptr89Arch,
	Ptr89SearchResult,
	Ptr89SearchType,
	Ptr89XRef,
} from "@sie-js/ptr89";
import { createStoreWithApi } from "@/utils/createStoreWithApi";
import {
	loadPersistentFiles,
	readPersistentFile,
	removePersistentFile,
	requestPersistentFilePermissions,
	savePersistentFile,
} from "@/utils/persistentFiles";

export type AddressSpace = "data" | "code";

export interface Fullflash {
	id: string;
	name: string;
	folder: string;
	arch: Ptr89Arch;
	base?: number;
}

export interface FullflashMatch extends Ptr89SearchResult {
	fullflashId: string;
	fullflashName: string;
	arch: Ptr89Arch;
}

export interface SearchResult {
	fullflashes: Fullflash[];
	matches: FullflashMatch[];
	issues: Array<{ fullflashId: string; fullflashName: string; message: string }>;
	type: Ptr89SearchType;
	duration: number;
}

export interface XRefResult {
	xrefs: Ptr89XRef[];
	duration: number;
}

export const usePtr89State = createStoreWithApi(
	() => ({
		fullflashes: [] as Fullflash[],
		disabledFullflashIds: [] as string[],
		folder: "",
		pattern: "",
		align: 1,
		limit: 10,
		showAddressBytes: false,
		addressSpace: "data" as AddressSpace,
		xrefAddress: "",
		xrefFullflashId: "",
	}),
	(state, setState) => ({
		setState,
		loadFiles: loadPersistentFiles,
		readFile(fullflash: Fullflash) {
			return readPersistentFile(fullflash.id);
		},
		requestFilePermissions(fullflashes: Fullflash[]) {
			return requestPersistentFilePermissions(fullflashes.map((fullflash) => fullflash.id));
		},
		async addFullflashes(fullflashes: Fullflash[], files: FileWithHandle[]) {
			const savedIds: string[] = [];
			try {
				for (let i = 0; i < fullflashes.length; i++) {
					await savePersistentFile(fullflashes[i].id, files[i]);
					savedIds.push(fullflashes[i].id);
				}
			} catch (error) {
				await Promise.all(savedIds.map(removePersistentFile));
				throw error;
			}
			setState("fullflashes", (saved) => [...saved, ...fullflashes]);
		},
		updateFullflashes(fullflashes: Fullflash[]) {
			const savedFullflashes = new Map(state.fullflashes.map((fullflash) => [fullflash.id, fullflash]));
			const changed = fullflashes.some((fullflash) => {
				const saved = savedFullflashes.get(fullflash.id);
				return !saved ||
					saved.name !== fullflash.name ||
					saved.arch !== fullflash.arch ||
					saved.base !== fullflash.base ||
					saved.folder !== fullflash.folder;
			});
			if (changed)
				setState("fullflashes", fullflashes);
			return changed;
		},
		async removeFullflash(id: string) {
			await removePersistentFile(id);
			setState("fullflashes", (fullflashes) => fullflashes.filter((fullflash) => fullflash.id !== id));
			setState("disabledFullflashIds", (ids) => ids.filter((disabledId) => disabledId !== id));
		},
		setFullflashEnabled(id: string, enabled: boolean) {
			setState("disabledFullflashIds", (ids) => enabled ?
				ids.filter((disabledId) => disabledId !== id) :
				[...ids, id]
			);
		},
	}),
	{ persist: { name: "ptr89", debounce: 250 } }
);
