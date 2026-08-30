export function formatId(id: number) {
	return id.toString(16).padStart(3, '0').toUpperCase();
}

export function formatAddress(address: number) {
	return address.toString(16).padStart(8, '0').toUpperCase();
}

export function formatLittleEndian32(value: number) {
	return [0, 8, 16, 24]
		.map((shift) => (Math.floor(value / 2 ** shift) % 0x100).toString(16).toUpperCase().padStart(2, "0"))
		.join(" ");
}
