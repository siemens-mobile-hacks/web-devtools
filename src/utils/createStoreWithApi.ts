import { PersistentStoreOptions, makePersistedStore } from '@/utils/makePersistedStore';
import { createRoot } from 'solid-js';
import { SetStoreFunction, createStore } from 'solid-js/store';

export interface CreateStoreWithApiOptions<S> {
	persist?: PersistentStoreOptions<S>;
}

export function createStoreWithApi<S extends object, A>(
	initialData: () => S,
	createApi: (store: S, set: SetStoreFunction<S>) => A,
	options?: CreateStoreWithApiOptions<S>
): () => [store: S, api: A] {
	const [store, setStore] = createRoot(() => {
		return options?.persist ?
			makePersistedStore(createStore<S>(initialData()), options.persist) :
			createStore<S>(initialData());
	});
	const api = createApi(store, setStore);
	return () => [store, api];
}
