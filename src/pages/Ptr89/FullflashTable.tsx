import { type Component, For, Show } from "solid-js";
import { type SetStoreFunction } from "solid-js/store";
import { Button, Form } from "solid-bootstrap";
import { FolderSelect } from "@/pages/Ptr89/FolderSelect";
import type { Fullflash } from "@/pages/Ptr89/store/ptr89State";

interface FullflashTableProps {
	fullflashes: Fullflash[];
	setFullflashes: SetStoreFunction<Fullflash[]>;
	folders: string[];
	onRemove?: (id: string) => void;
	removeDisabled?: boolean;
}

export const FullflashTable: Component<FullflashTableProps> = (props) => (
	<table class="table table-sm table-bordered align-middle mb-0">
		<colgroup>
			<col style={{ width: "70%" }} />
			<col style={{ width: "30%" }} />
			<col />
			<col />
			<Show when={props.onRemove}><col /></Show>
		</colgroup>
		<thead>
			<tr>
				<th>Name</th>
				<th>Folder</th>
				<th>Arch</th>
				<th>Base</th>
				<Show when={props.onRemove}><th class="p-1"></th></Show>
			</tr>
		</thead>
		<tbody>
			<For each={props.fullflashes}>{(fullflash, index) =>
				<tr>
					<td>
						<Form.Control
							size="sm"
							value={fullflash.name}
							onInput={(e) => props.setFullflashes(index(), "name", e.currentTarget.value)}
						/>
					</td>
					<td>
						<FolderSelect
							folders={props.folders}
							value={fullflash.folder}
							onChange={(folder) => props.setFullflashes(index(), "folder", folder)}
						/>
					</td>
					<td>
						<Form.Select
							size="sm"
							class="w-auto"
							value={fullflash.arch}
							onChange={(e) => props.setFullflashes(index(), "arch", e.currentTarget.value as Fullflash["arch"])}
						>
							<option value="arm">ARM</option>
							<option value="c166">C166</option>
						</Form.Select>
					</td>
					<td>
						<Form.Control
							size="sm"
							htmlSize={4}
							maxLength={8}
							class="font-monospace"
							value={fullflash.base?.toString(16).toUpperCase() ?? ""}
							placeholder={fullflash.arch === "arm" ? "A0000000" : "Auto"}
							onInput={(e) => {
								const value = e.currentTarget.value;
								if (/^[0-9A-F]{0,8}$/i.test(value)) {
									props.setFullflashes(index(), "base", value ? Number.parseInt(value, 16) : undefined);
								} else {
									e.currentTarget.value = fullflash.base?.toString(16).toUpperCase() ?? "";
								}
							}}
						/>
					</td>
					<Show when={props.onRemove}>
						<td class="text-nowrap text-center p-1">
							<Button
								type="button"
								variant="outline-danger"
								size="sm"
								class="py-0 px-1"
								aria-label={`Remove ${fullflash.name}`}
								title={`Remove ${fullflash.name}`}
								disabled={props.removeDisabled}
								onClick={() => props.onRemove?.(fullflash.id)}
							>
								<i class="bi bi-trash"></i>
							</Button>
						</td>
					</Show>
				</tr>
			}</For>
		</tbody>
	</table>
);
