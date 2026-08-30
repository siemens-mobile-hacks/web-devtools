import { createStoreWithApi } from "@/utils/createStoreWithApi";
import {
	c166CodePointerToPhysical,
	c166DataPointerToPhysical,
	physicalToC166CodePointer,
	physicalToC166DataPointer,
} from "@/utils/c166";
import { formatAddress, formatLittleEndian32 } from "@/utils/format";

export const MAX_C166_ADDRESS = 0xFFFFFF;
const MAX_ADDRESS = 0xFFFFFFFF;

export type CalculatorFieldName =
	| "physicalAddress"
	| "physicalAddressBytes"
	| "fileOffset"
	| "fileOffsetBytes"
	| "codePointer"
	| "dataPointer"
	| "codePointerBytes"
	| "dataPointerBytes";

type CalculatorValues = Record<CalculatorFieldName, string>;

const formatHex = (value: number, width: number) => value.toString(16).toUpperCase().padStart(width, "0");

const parseHex = (value: string, maximum: number) => {
	const normalized = value.trim().replace(/^0x/i, "");
	if (!normalized || !/^[0-9A-F]+$/i.test(normalized))
		return;

	const parsed = Number.parseInt(normalized, 16);
	return parsed <= maximum ? parsed : undefined;
};

const parseLittleEndian32 = (value: string) => {
	const normalized = value.replace(/\s/g, "");
	if (!/^[0-9A-F]{8}$/i.test(normalized))
		return;

	return [0, 2, 4, 6].reduce((result, offset, index) =>
		result + Number.parseInt(normalized.slice(offset, offset + 2), 16) * 2 ** (index * 8), 0);
};

const parsePointer = (value: string, maximumPage: number, maximumOffset: number) => {
	const match = value.trim().match(/^(?:0x)?([0-9A-F]+):(?:0x)?([0-9A-F]+)$/i);
	if (!match)
		return;

	const page = Number.parseInt(match[1], 16);
	const offset = Number.parseInt(match[2], 16);
	return page <= maximumPage && offset <= maximumOffset ? { page, offset } : undefined;
};

const parsePackedPointer = (value: string, maximumPage: number, maximumOffset: number) => {
	const packed = parseLittleEndian32(value);
	if (packed === undefined)
		return;

	const page = Math.floor(packed / 0x10000);
	const offset = packed % 0x10000;
	return page <= maximumPage && offset <= maximumOffset ? { page, offset } : undefined;
};

const getPhysicalAddress = (field: CalculatorFieldName, value: string, base: number): number | undefined => {
	switch (field) {
		case "physicalAddress":
			return parseHex(value, MAX_ADDRESS);
		case "physicalAddressBytes":
			return parseLittleEndian32(value);
		case "fileOffset": {
			const offset = parseHex(value, MAX_ADDRESS);
			return offset !== undefined && base + offset <= MAX_ADDRESS ? base + offset : undefined;
		}
		case "fileOffsetBytes": {
			const offset = parseLittleEndian32(value);
			return offset !== undefined && base + offset <= MAX_ADDRESS ? base + offset : undefined;
		}
		case "codePointer": {
			const pointer = parsePointer(value, 0xFF, 0xFFFF);
			return pointer ? c166CodePointerToPhysical(pointer.page, pointer.offset) : undefined;
		}
		case "dataPointer": {
			const pointer = parsePointer(value, 0x3FF, 0x3FFF);
			return pointer ? c166DataPointerToPhysical(pointer.page, pointer.offset) : undefined;
		}
		case "codePointerBytes": {
			const pointer = parsePackedPointer(value, 0xFF, 0xFFFF);
			return pointer ? c166CodePointerToPhysical(pointer.page, pointer.offset) : undefined;
		}
		case "dataPointerBytes": {
			const pointer = parsePackedPointer(value, 0x3FF, 0x3FFF);
			return pointer ? c166DataPointerToPhysical(pointer.page, pointer.offset) : undefined;
		}
	}
};

const calculateValues = (physicalAddress: number, base: number): CalculatorValues => {
	const fileOffset = physicalAddress >= base ? physicalAddress - base : undefined;
	let codePointer = "";
	let dataPointer = "";
	let codePointerBytes = "";
	let dataPointerBytes = "";

	if (physicalAddress <= MAX_C166_ADDRESS) {
		const code = physicalToC166CodePointer(physicalAddress);
		const data = physicalToC166DataPointer(physicalAddress);
		codePointer = `${formatHex(code.segment, 2)}:${formatHex(code.offset, 4)}`;
		dataPointer = `${formatHex(data.page, 4)}:${formatHex(data.offset, 4)}`;
		codePointerBytes = formatLittleEndian32(code.segment * 0x10000 + code.offset);
		dataPointerBytes = formatLittleEndian32(data.page * 0x10000 + data.offset);
	}

	return {
		physicalAddress: formatAddress(physicalAddress),
		physicalAddressBytes: formatLittleEndian32(physicalAddress),
		fileOffset: fileOffset === undefined ? "" : formatAddress(fileOffset),
		fileOffsetBytes: fileOffset === undefined ? "" : formatLittleEndian32(fileOffset),
		codePointer,
		dataPointer,
		codePointerBytes,
		dataPointerBytes,
	};
};

export const useC166CalculatorState = createStoreWithApi(
	() => ({
		baseValue: "0x000000",
		base: 0,
		physicalAddress: 0,
		source: "physicalAddress" as CalculatorFieldName,
		sourceValue: "00000000",
	}),
	(state, setState) => ({
		getFieldValue(field: CalculatorFieldName) {
			return state.source === field ?
				state.sourceValue :
				calculateValues(state.physicalAddress, state.base)[field];
		},
		setFieldValue(field: CalculatorFieldName, value: string) {
			setState({ source: field, sourceValue: value });

			const address = getPhysicalAddress(field, value, state.base);
			if (address !== undefined)
				setState("physicalAddress", address);
		},
		setBaseValue(value: string) {
			setState("baseValue", value);

			const base = parseHex(value, MAX_ADDRESS);
			if (base === undefined)
				return;

			setState("base", base);
			const address = getPhysicalAddress(state.source, state.sourceValue, base);
			if (address !== undefined)
				setState("physicalAddress", address);
		},
	}),
	{ persist: { name: "c166Calculator", debounce: 250 } }
);
