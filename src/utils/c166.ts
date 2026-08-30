export interface C166CodePointer {
	segment: number;
	offset: number;
}

export interface C166DataPointer {
	page: number;
	offset: number;
}

export function physicalToC166CodePointer(address: number): C166CodePointer {
	return {
		segment: Math.floor(address / 0x10000),
		offset: address % 0x10000,
	};
}

export function c166CodePointerToPhysical(segment: number, offset: number): number {
	return segment * 0x10000 + offset;
}

export function physicalToC166DataPointer(address: number): C166DataPointer {
	return {
		page: Math.floor(address / 0x4000),
		offset: address % 0x4000,
	};
}

export function c166DataPointerToPhysical(page: number, offset: number): number {
	return page * 0x4000 + offset;
}
