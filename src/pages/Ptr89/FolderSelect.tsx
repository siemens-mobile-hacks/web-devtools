import { type Component, createSignal, For, Show } from "solid-js";
import { Form } from "solid-bootstrap";

interface FolderSelectProps {
	id?: string;
	class?: string;
	value: string;
	folders: string[];
	onChange: (folder: string) => void;
}

export const FolderSelect: Component<FolderSelectProps> = (props) => {
	const [adding, setAdding] = createSignal(false);
	const showInput = () => adding() || Boolean(props.value && !props.folders.includes(props.value));

	const handleSelect = (select: HTMLSelectElement) => {
		if (select.selectedOptions[0]?.dataset.action === "add") {
			props.onChange("");
			setAdding(true);
		} else {
			setAdding(false);
			props.onChange(select.value);
		}
	};

	return (
		<Show
			when={showInput()}
			fallback={
				<Form.Select
					id={props.id}
					size="sm"
					class={props.class}
					style={{ "min-width": 0, "max-width": "100%" }}
					value={props.value}
					onChange={(e) => handleSelect(e.currentTarget)}
				>
					<option value="">—</option>
					<For each={props.folders}>{(folder) => <option value={folder}>{folder}</option>}</For>
					<option value="" data-action="add">Add new</option>
				</Form.Select>
			}
		>
			<Form.Control
				id={props.id}
				size="sm"
				class={props.class}
				style={{ "min-width": 0, "max-width": "100%" }}
				autofocus
				placeholder="New folder"
				value={props.value}
				onInput={(e) => props.onChange(e.currentTarget.value)}
				onBlur={() => setAdding(false)}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						props.onChange("");
						setAdding(false);
					}
				}}
			/>
		</Show>
	);
};
