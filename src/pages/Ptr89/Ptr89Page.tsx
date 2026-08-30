import { type Component, createMemo, createResource, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Button, Form, Nav, Spinner } from "solid-bootstrap";
import { fileOpen, type FileWithHandle } from "browser-fs-access";
import type { Ptr89WorkerPayload, Ptr89WorkerResponse } from "@/pages/Ptr89/ptr89.worker";
import { FullflashAddModal } from "@/pages/Ptr89/FullflashAddModal";
import { FullflashSettingsModal } from "@/pages/Ptr89/FullflashSettingsModal";
import {
	SearchResults,
	XRefResults,
} from "@/pages/Ptr89/Ptr89Results";
import {
	type Fullflash,
	type FullflashMatch,
	type SearchResult,
	type XRefResult,
	usePtr89State,
} from "@/pages/Ptr89/store/ptr89State";

type ActiveTab = "search" | "xrefs";

const parseAddress = (value: string) => Number(`0x${value.trim().replace(/^0x/i, "")}`);

const getErrorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

const resizePatternInput = (input: HTMLElement) => {
	input.style.height = "auto";
	input.style.height = `${input.scrollHeight}px`;
};

const Ptr89Page: Component = () => {
	const ptr89Worker = new Worker(new URL("./ptr89.worker.ts", import.meta.url), { type: "module" });
	let patternInput!: HTMLTextAreaElement;
	const [ptr89State, ptr89] = usePtr89State();
	const [fileStorage] = createResource(ptr89.loadFiles);
	const [pendingFiles, setPendingFiles] = createSignal<FileWithHandle[]>();
	const [settingsOpen, setSettingsOpen] = createSignal(false);
	const [activeTab, setActiveTab] = createSignal<ActiveTab>("search");
	const [searchResult, setSearchResult] = createSignal<SearchResult>();
	const [xrefResult, setXrefResult] = createSignal<XRefResult>();
	const [error, setError] = createSignal<string>();
	const [adding, setAdding] = createSignal(false);
	const [formatting, setFormatting] = createSignal(false);
	const [searching, setSearching] = createSignal(false);
	const [progress, setProgress] = createSignal<string>();
	const folders = createMemo(() => [...new Set(
		ptr89State.fullflashes.map((fullflash) => fullflash.folder).filter(Boolean)
	)].sort());
	const selectedFolder = createMemo(() => folders().includes(ptr89State.folder) ? ptr89State.folder : "");
	const filteredFullflashes = createMemo(() => ptr89State.fullflashes.filter((fullflash) =>
		!selectedFolder() || fullflash.folder === selectedFolder()
	));
	const selectedFullflashes = createMemo(() =>
		filteredFullflashes().filter((fullflash) => !ptr89State.disabledFullflashIds.includes(fullflash.id))
	);
	const selectedXrefFullflash = createMemo(() => {
		const availableFullflashes = filteredFullflashes();
		return availableFullflashes.find((fullflash) => fullflash.id === ptr89State.xrefFullflashId) ??
			availableFullflashes[0];
	});
	onMount(() => resizePatternInput(patternInput));
	onCleanup(() => {
		ptr89Worker.terminate();
	});

	const runWorker = (payload: Ptr89WorkerPayload) => new Promise<Ptr89WorkerResponse>((resolve, reject) => {
		ptr89Worker.onmessage = (event: MessageEvent<Ptr89WorkerResponse>) => resolve(event.data);
		ptr89Worker.onerror = (event) => reject(new Error(event.message));
		ptr89Worker.postMessage(payload);
	});

	const handleAdd = async () => {
		setAdding(true);
		setError(undefined);

		try {
			const files = await fileOpen({
				description: "Fullflash",
				id: "ptr89-fullflash",
				multiple: true,
			});
			setPendingFiles(files);
		} catch (err) {
			if (!(err instanceof DOMException && err.name === "AbortError"))
				setError(getErrorMessage(err));
		} finally {
			setAdding(false);
		}
	};

	const handleSaveSettings = (settings: Fullflash[]) => {
		if (ptr89.updateFullflashes(settings)) {
			setSearchResult(undefined);
			setXrefResult(undefined);
		}
	};

	const handleRemove = async (id: string) => {
		await ptr89.removeFullflash(id);
		setSearchResult(undefined);
		setXrefResult(undefined);
	};

	const handleFullflashToggle = (id: string, enabled: boolean) => {
		ptr89.setFullflashEnabled(id, enabled);
	};

	const handlePrettify = async () => {
		if (formatting() || searching())
			return;

		setFormatting(true);
		setError(undefined);
		try {
			const response = await runWorker({ operation: "prettify", pattern: ptr89State.pattern });
			if ("error" in response)
				throw new Error(response.error);
			if (!("pattern" in response))
				throw new Error("Unexpected worker response.");
			ptr89.setState("pattern", response.pattern);
			resizePatternInput(patternInput);
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setFormatting(false);
		}
	};

	const handleSearch = async (e: SubmitEvent) => {
		e.preventDefault();
		if (searching() || formatting() || fileStorage.loading)
			return;

		const searchFullflashes = selectedFullflashes();
		if (!searchFullflashes.length) {
			setError("Select at least one fullflash first.");
			return;
		}

		setSearching(true);
		setError(undefined);
		setSearchResult(undefined);
		const startedAt = performance.now();

		try {
			await ptr89.requestFilePermissions(searchFullflashes);
			const foundMatches: FullflashMatch[] = [];
			const searchIssues: SearchResult["issues"] = [];
			let resultType: SearchResult["type"] | undefined;

			for (let i = 0; i < searchFullflashes.length; i++) {
				const fullflash = searchFullflashes[i];
				setProgress(`Searching ${i + 1}/${searchFullflashes.length}: ${fullflash.name}`);

				try {
					const file = await ptr89.readFile(fullflash);
					const response = await runWorker({
						operation: "find",
						file,
						options: { arch: fullflash.arch, base: fullflash.base },
						pattern: ptr89State.pattern.trim(),
						limit: ptr89State.limit,
						align: ptr89State.align,
					});
					if ("error" in response)
						throw new Error(response.error);
					if (!("matches" in response))
						throw new Error("Unexpected worker response.");

					resultType ??= response.type;
					foundMatches.push(...response.matches.map((match) => ({
						...match,
						fullflashId: fullflash.id,
						fullflashName: fullflash.name,
						arch: fullflash.arch,
					})));
				} catch (err) {
					searchIssues.push({ fullflashName: fullflash.name, message: getErrorMessage(err) });
				}
			}
			if (!resultType)
				throw new Error(searchIssues.map((issue) => `${issue.fullflashName}: ${issue.message}`).join(" "));

			setSearchResult({
				matches: foundMatches,
				issues: searchIssues,
				type: resultType,
				duration: performance.now() - startedAt,
			});
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setProgress(undefined);
			setSearching(false);
		}
	};

	const handleXrefSearch = async (e: SubmitEvent) => {
		e.preventDefault();
		if (searching() || formatting() || fileStorage.loading)
			return;

		const fullflash = selectedXrefFullflash();
		if (!fullflash) {
			setError("Select a fullflash first.");
			return;
		}

		setSearching(true);
		setError(undefined);
		setXrefResult(undefined);
		const startedAt = performance.now();

		try {
			const address = parseAddress(ptr89State.xrefAddress);
			await ptr89.requestFilePermissions([fullflash]);

			setProgress(`Searching ${fullflash.name}`);
			const file = await ptr89.readFile(fullflash);
			const response = await runWorker({
				operation: "findXRefs",
				file,
				options: { arch: fullflash.arch, base: fullflash.base },
				address,
				limit: ptr89State.limit,
			});
			if ("error" in response)
				throw new Error(response.error);
			if (!("xrefs" in response))
				throw new Error("Unexpected worker response.");

			setXrefResult({
				xrefs: response.xrefs,
				duration: performance.now() - startedAt,
			});
		} catch (err) {
			setError(getErrorMessage(err));
		} finally {
			setProgress(undefined);
			setSearching(false);
		}
	};

	return (
		<>
			<Nav
				variant="tabs"
				activeKey={activeTab()}
				class="mb-2"
				onSelect={(key) => {
					if (key !== "search" && key !== "xrefs")
						return;
					setActiveTab(key);
					setError(undefined);
				}}
			>
				<Nav.Item>
					<Nav.Link eventKey="search">Search</Nav.Link>
				</Nav.Item>
				<Nav.Item>
					<Nav.Link eventKey="xrefs">X-Reference</Nav.Link>
				</Nav.Item>
			</Nav>
			<div class="d-flex flex-wrap align-items-center gap-2 mb-2">
				<Button type="button" size="sm" variant="outline-primary" class="text-nowrap" onClick={handleAdd} disabled={adding() || fileStorage.loading}>
					<Show when={adding()}>
						<Spinner animation="border" size="sm" class="me-2" />
					</Show>
					<i class="bi bi-plus-lg me-1"></i>
					Add fullflashes
				</Button>
				<Button
					type="button"
					size="sm"
					variant="outline-secondary"
					aria-label="Fullflashes list"
					title="Fullflashes list"
					disabled={fileStorage.loading || !ptr89State.fullflashes.length}
					onClick={() => setSettingsOpen(true)}
				>
					<i class="bi bi-gear"></i>
				</Button>
				<Show when={folders().length > 0}>
					<div class="d-flex align-items-center gap-1">
						<label for="ptr89-folder" class="small text-secondary text-nowrap">Folder</label>
						<Form.Select
							id="ptr89-folder"
							size="sm"
							class="w-auto"
							value={selectedFolder()}
							onChange={(e) => {
								ptr89.setState("folder", e.currentTarget.value);
								setXrefResult(undefined);
							}}
						>
							<option value="">All</option>
							<For each={folders()}>{(folder) => <option value={folder}>{folder}</option>}</For>
						</Form.Select>
					</div>
				</Show>
				<Show when={activeTab() === "search"}>
					<div class="d-flex align-items-center gap-1">
						<label for="ptr89-align" class="small text-secondary text-nowrap">Align</label>
						<Form.Control
							id="ptr89-align"
							size="sm"
							type="number"
							min="1"
							style={{ width: "4em" }}
							value={ptr89State.align}
							onInput={(e) => ptr89.setState("align", Number(e.currentTarget.value))}
						/>
					</div>
				</Show>
				<div class="d-flex align-items-center gap-1">
					<label for="ptr89-limit" class="small text-secondary text-nowrap">Limit</label>
					<Form.Control
						id="ptr89-limit"
						size="sm"
						type="number"
						min="0"
						style={{ width: "5em" }}
						value={ptr89State.limit}
						onInput={(e) => ptr89.setState("limit", Number(e.currentTarget.value))}
					/>
				</div>
				<Show when={activeTab() === "search"}>
					<Button
						as="a"
						size="sm"
						variant="outline-secondary"
						class="text-nowrap ms-auto"
						href="https://github.com/siemens-mobile-hacks/ptr89#pattern-syntax"
						target="_blank"
						rel="noopener"
					>
						<i class="bi bi-question-circle me-1"></i>
						Help
					</Button>
				</Show>
			</div>

			<Show when={pendingFiles()}>{(files) =>
				<FullflashAddModal
					files={files()}
					folders={folders()}
					onAdd={ptr89.addFullflashes}
					onHide={() => setPendingFiles(undefined)}
				/>
			}</Show>
			<Show when={settingsOpen()}>
				<FullflashSettingsModal
					fullflashes={ptr89State.fullflashes}
					folders={folders()}
					onSave={handleSaveSettings}
					onRemove={handleRemove}
					onHide={() => setSettingsOpen(false)}
				/>
			</Show>

			<Show when={fileStorage.loading}>
				<Spinner animation="border" role="status">
					<span class="visually-hidden">Loading...</span>
				</Spinner>
			</Show>
			<Show when={fileStorage.error}>
				<div class="alert alert-danger py-2" role="alert">Can't load saved files.</div>
			</Show>
			<Show
				when={ptr89State.fullflashes.length > 0}
				fallback={<div class="small text-secondary mb-2">No fullflashes added.</div>}
			>
				<div class="d-flex flex-wrap align-items-center gap-3 mb-2">
					<For each={filteredFullflashes()}>{(fullflash) =>
						<label class="d-flex align-items-center gap-1 text-nowrap">
							<Show
								when={activeTab() === "search"}
								fallback={
									<input
										type="radio"
										name="ptr89-xref-fullflash"
										class="form-check-input mt-0"
										checked={selectedXrefFullflash()?.id === fullflash.id}
										onChange={() => {
											ptr89.setState("xrefFullflashId", fullflash.id);
											setXrefResult(undefined);
										}}
									/>
								}
							>
								<input
									type="checkbox"
									class="form-check-input mt-0"
									checked={!ptr89State.disabledFullflashIds.includes(fullflash.id)}
									onChange={(e) => handleFullflashToggle(fullflash.id, e.currentTarget.checked)}
								/>
							</Show>
							<span>{fullflash.name}</span>
						</label>
					}</For>
				</div>
			</Show>

			<Form hidden={activeTab() !== "search"} onSubmit={handleSearch}>
				<div class="d-flex flex-nowrap align-items-end gap-2 mb-2">
					<Form.Group class="flex-grow-1">
						<Form.Label for="ptr89-pattern" class="visually-hidden">Pattern</Form.Label>
						<Form.Control
							ref={patternInput}
							id="ptr89-pattern"
							as="textarea"
							rows={1}
							class="font-monospace"
							style={{ resize: "none", overflow: "hidden" }}
							placeholder="Pattern"
							value={ptr89State.pattern}
							onInput={(e) => {
								ptr89.setState("pattern", e.currentTarget.value);
								resizePatternInput(e.currentTarget);
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									e.currentTarget.form?.requestSubmit();
								}
							}}
							required
						/>
					</Form.Group>
					<Button
						type="button"
						variant="outline-secondary"
						aria-label="Prettify pattern"
						title="Prettify pattern"
						disabled={formatting() || searching() || !ptr89State.pattern.trim()}
						onClick={handlePrettify}
					>
						<Show when={formatting()} fallback={<i class="bi bi-magic"></i>}>
							<Spinner animation="border" size="sm" />
						</Show>
					</Button>
					<Button
						type="submit"
						class="text-nowrap"
						disabled={searching() || formatting() || fileStorage.loading || !selectedFullflashes().length}
					>
						<Show when={searching()}>
							<Spinner animation="border" size="sm" class="me-2" />
						</Show>
						Search
					</Button>
				</div>
			</Form>
			<Form hidden={activeTab() !== "xrefs"} onSubmit={handleXrefSearch}>
				<div class="d-flex align-items-end gap-2 mb-2">
					<Form.Group>
						<Form.Label for="ptr89-xref-address" class="visually-hidden">Address</Form.Label>
						<input
							id="ptr89-xref-address"
							size={8}
							class="form-control font-monospace"
							placeholder="Address"
							value={ptr89State.xrefAddress}
							onInput={(e) => ptr89.setState("xrefAddress", e.currentTarget.value)}
							required
						/>
					</Form.Group>
					<Button
						type="submit"
						class="text-nowrap"
						disabled={searching() || formatting() || fileStorage.loading || !selectedXrefFullflash()}
					>
						<Show when={searching()}>
							<Spinner animation="border" size="sm" class="me-2" />
						</Show>
						Search
					</Button>
				</div>
			</Form>
			<Show when={progress()}>
				<div class="small text-secondary mb-2">{progress()}</div>
			</Show>

			<Show when={error()}>
				<div class="alert alert-danger py-2 mt-2" role="alert">{error()}</div>
			</Show>
			<Show when={activeTab() === "search" ? searchResult() : undefined}>{(result) =>
				<SearchResults result={result()} />
			}</Show>
			<Show when={activeTab() === "xrefs" ? xrefResult() : undefined}>{(result) =>
				<XRefResults result={result()} />
			}</Show>
		</>
	);
};

export default Ptr89Page;
