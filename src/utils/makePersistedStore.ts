import { SetStoreFunction, Store, reconcile, unwrap } from 'solid-js/store';
import { debounce } from "es-toolkit";

export type PersistentStore<T> = [get: Store<T>, set: SetStoreFunction<T>];

interface PersistentStoreInternal {
	version: number;
	state: unknown;
}

export interface PersistentStoreOptions<T> {
	name: string;
	storage?: Storage;
	version?: number;
	serialize?: (data: any) => string;
	deserialize?: (data: string) => any;
	migrate?: (persistedState: T, version: number) => T;
	merge?: (persistedState: T, currentState: T) => T;
	skipLoad?: boolean;
	debounce?: number;
}

export function makePersistedStore<T>(store: [Store<T>, SetStoreFunction<T>], options: PersistentStoreOptions<T>): PersistentStore<T> {
	const {
		name,
		storage = localStorage,
		version = 0,
		migrate = (persistedState) => persistedState,
		merge = (persistedState, currentState) => ({ ...currentState, ...persistedState }),
		serialize = JSON.stringify,
		deserialize = JSON.parse,
		skipLoad,
		debounce: debounceInterval = 0,
	} = options;

	const storedValue = skipLoad ? null : storage.getItem(name);
	if (storedValue !== null) {
		const parsed = deserialize(storedValue) as PersistentStoreInternal;
		if (parsed != null && typeof parsed.version === "number") {
			const persistedState = parsed.version === version ?
				parsed.state as T :
				migrate(parsed.state as T, parsed.version);
			store[1](reconcile(merge(persistedState, unwrap(store[0]))));
		}
	}

	const updateStorage = debounce(() => {
		const serialized = serialize({
			version,
			state: unwrap(store[0]) as unknown,
		} as PersistentStoreInternal);
		storage.setItem(name, serialized);
	}, debounceInterval);

	const setWithPersistence: SetStoreFunction<T> = (...args: any) => {
		(store[1] as any)(...args);
		updateStorage();
	};

	return [store[0], setWithPersistence];
}
