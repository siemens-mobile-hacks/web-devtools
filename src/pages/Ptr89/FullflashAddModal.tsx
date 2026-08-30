import { type Component, createMemo, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Modal, Spinner } from "solid-bootstrap";
import { type FileWithHandle } from "browser-fs-access";
import { FolderSelect } from "@/pages/Ptr89/FolderSelect";
import type { Fullflash } from "@/pages/Ptr89/store/ptr89State";
import { FullflashTable } from "@/pages/Ptr89/FullflashTable";

interface FullflashAddModalProps {
	files: FileWithHandle[];
	folders: string[];
	onAdd: (fullflashes: Fullflash[], files: FileWithHandle[]) => Promise<void>;
	onHide: () => void;
}

export const FullflashAddModal: Component<FullflashAddModalProps> = (props) => {
	const [show, setShow] = createSignal(true);
	const [saving, setSaving] = createSignal(false);
	const [error, setError] = createSignal<string>();
	const [commonFolder, setCommonFolder] = createSignal("");
	const [fullflashes, setFullflashes] = createStore<Fullflash[]>(props.files.map((file) => ({
		id: crypto.randomUUID(),
		name: file.name.replace(/\.[^.]+$/, "") || file.name,
		folder: "",
		arch: "arm",
	})));
	const folders = createMemo(() => [...new Set([
		...props.folders,
		...fullflashes.map((fullflash) => fullflash.folder),
	].filter(Boolean))].sort());
	const handleCommonFolderChange = (folder: string) => {
		const previousFolder = commonFolder();
		setCommonFolder(folder);
		setFullflashes(fullflashes.map((fullflash) => {
			if (fullflash.folder && fullflash.folder !== previousFolder)
				return fullflash;
			return { ...fullflash, folder };
		}));
	};

	const handleAdd = async () => {
		setSaving(true);
		setError(undefined);

		try {
			await props.onAdd(fullflashes, props.files);
			setShow(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal size="lg" centered scrollable show={show()} onHide={() => !saving() && setShow(false)} onExited={props.onHide}>
			<Modal.Header closeButton>
				<Modal.Title>Add fullflashes</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div class="d-flex align-items-center gap-2 mb-2">
					<label for="ptr89-common-folder" class="small text-secondary text-nowrap">Folder for all</label>
					<FolderSelect
						id="ptr89-common-folder"
						class="w-auto"
						folders={folders()}
						value={commonFolder()}
						onChange={handleCommonFolderChange}
					/>
				</div>
				<FullflashTable
					fullflashes={fullflashes}
					setFullflashes={setFullflashes}
					folders={folders()}
				/>

				<Show when={error()}>
					<div class="alert alert-danger mt-3 mb-0" role="alert">{error()}</div>
				</Show>
			</Modal.Body>
			<Modal.Footer>
				<Button size="sm" variant="secondary" onClick={() => setShow(false)} disabled={saving()}>
					Cancel
				</Button>
				<Button size="sm" onClick={handleAdd} disabled={saving()}>
					<Show when={saving()}>
						<Spinner animation="border" size="sm" class="me-2" />
					</Show>
					Save
				</Button>
			</Modal.Footer>
		</Modal>
	);
};
