import { type Component, createMemo, createSignal, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Button, Modal } from "solid-bootstrap";
import type { Fullflash } from "@/pages/Ptr89/store/ptr89State";
import { FullflashTable } from "@/pages/Ptr89/FullflashTable";

interface FullflashSettingsModalProps {
	fullflashes: Fullflash[];
	folders: string[];
	onSave: (fullflashes: Fullflash[]) => Promise<void>;
	onHide: () => void;
}

export const FullflashSettingsModal: Component<FullflashSettingsModalProps> = (props) => {
	const [show, setShow] = createSignal(true);
	const [saving, setSaving] = createSignal(false);
	const [error, setError] = createSignal<string>();
	const [fullflashes, setFullflashes] = createStore<Fullflash[]>(props.fullflashes.map((fullflash) => ({ ...fullflash })));
	const folders = createMemo(() => [...new Set([
		...props.folders,
		...fullflashes.map((fullflash) => fullflash.folder),
	].filter(Boolean))].sort());

	const handleClose = () => {
		if (saving())
			return;

		setShow(false);
	};

	const handleSave = async () => {
		if (saving())
			return;

		setSaving(true);
		setError(undefined);
		try {
			await props.onSave(fullflashes);
			setShow(false);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setSaving(false);
		}
	};

	const handleRemove = (id: string) => setFullflashes(fullflashes.filter((fullflash) => fullflash.id !== id));

	return (
		<Modal size="lg" centered show={show()} onHide={handleClose} onExited={props.onHide}>
			<Modal.Header closeButton>
				<Modal.Title>Fullflashes list</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<FullflashTable
					fullflashes={fullflashes}
					setFullflashes={setFullflashes}
					folders={folders()}
					onRemove={handleRemove}
					removeDisabled={saving()}
				/>

				<Show when={error()}>
					<div class="alert alert-danger py-2 mt-2 mb-0" role="alert">{error()}</div>
				</Show>
			</Modal.Body>
			<Modal.Footer>
				<Button disabled={saving()} onClick={handleSave}>
					Save
				</Button>
			</Modal.Footer>
		</Modal>
	);
};
