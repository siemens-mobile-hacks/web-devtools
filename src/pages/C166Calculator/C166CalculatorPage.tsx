import { type Component, For } from "solid-js";
import { Form } from "solid-bootstrap";
import clsx from "clsx";
import {
	type CalculatorFieldName,
	useC166CalculatorState,
} from "@/pages/C166Calculator/store/c166CalculatorState";
import "@/pages/C166Calculator/C166CalculatorPage.scss";

interface CalculatorInputProps {
	id: string;
	value: string;
	active: boolean;
	stacked?: boolean;
	ariaLabel?: string;
	onInput: (value: string) => void;
}

const columns: Array<{
	label: string;
	field: CalculatorFieldName;
	bytesField: CalculatorFieldName;
}> = [
	{ label: "Physical", field: "physicalAddress", bytesField: "physicalAddressBytes" },
	{ label: "Offset", field: "fileOffset", bytesField: "fileOffsetBytes" },
	{ label: "SEG:SOF (CODE)", field: "codePointer", bytesField: "codePointerBytes" },
	{ label: "PAG:POF (DATA)", field: "dataPointer", bytesField: "dataPointerBytes" },
];

const CalculatorInput: Component<CalculatorInputProps> = (props) => (
	<input
		id={props.id}
		size={12}
		class={clsx(
			"form-control font-monospace c166-calculator-input",
			props.stacked && "c166-calculator-input--bytes",
			props.active && "c166-calculator-input--source"
		)}
		value={props.value}
		aria-label={props.ariaLabel}
		autocomplete="off"
		spellcheck={false}
		onInput={(e) => props.onInput(e.currentTarget.value)}
	/>
);

const C166CalculatorPage: Component = () => {
	const [state, calculator] = useC166CalculatorState();

	return (
		<>
			<h5 class="mb-3">C166 calculator</h5>
			<Form.Group class="d-flex flex-wrap align-items-center gap-2 mb-3">
				<Form.Label for="c166-fullflash-base" class="mb-0 text-nowrap">
					Fullflash base
				</Form.Label>
				<input
					id="c166-fullflash-base"
					size={8}
					maxLength={8}
					class="form-control font-monospace"
					value={state.baseValue}
					autocomplete="off"
					spellcheck={false}
					onInput={(e) => calculator.setBaseValue(e.currentTarget.value)}
				/>
			</Form.Group>

			<div class="row g-3">
				<For each={columns}>{(column) =>
					<Form.Group class="col-auto">
						<Form.Label for={`c166-${column.field}`}>
							{column.label}
						</Form.Label>
						<CalculatorInput
							id={`c166-${column.field}`}
							value={calculator.getFieldValue(column.field)}
							active={state.source === column.field}
							onInput={(value) => calculator.setFieldValue(column.field, value)}
						/>
						<CalculatorInput
							id={`c166-${column.bytesField}`}
							value={calculator.getFieldValue(column.bytesField)}
							active={state.source === column.bytesField}
							stacked
							ariaLabel={`${column.label} bytes`}
							onInput={(value) => calculator.setFieldValue(column.bytesField, value)}
						/>
					</Form.Group>
				}</For>
			</div>
		</>
	);
};

export default C166CalculatorPage;
