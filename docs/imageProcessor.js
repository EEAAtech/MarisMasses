import { MASS_IMAGE_CONFIG } from './config.js';

export function readJpegInfo(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    if (view.getUint16(0) !== 0xFFD8) throw new Error("The selected file is not a valid JPEG image.");

    let offset = 2;
    let width = null, height = null, dpiX = null, dpiY = null, jfifOffset = null;

    while (offset < view.byteLength - 1) {
        if (view.getUint8(offset) !== 0xFF) { offset++; continue; }
        const marker = view.getUint8(offset + 1);
        if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { offset += 2; continue; }
        if (marker === 0xD9 || marker === 0xDA) break;

        const length = view.getUint16(offset + 2);
        if (marker === 0xE0 && length >= 14) {
            const id = String.fromCharCode(...Array.from(view.slice(offset + 4, offset + 8)));
            if (id === "JFIF") {
                jfifOffset = offset;
                const units = view.getUint8(offset + 11);
                if (units === 1) {
                    dpiX = view.getUint16(offset + 12);
                    dpiY = view.getUint16(offset + 14);
                } else if (units === 2) {
                    dpiX = Math.round(view.getUint16(offset + 12) * 2.54);
                    dpiY = Math.round(view.getUint16(offset + 14) * 2.54);
                }
            }
        }
        if (marker === 0xE1 && length >= 8 && dpiX === null) {
            const id = String.fromCharCode(...Array.from(view.slice(offset + 4, offset + 8)));
            if (id === "Exif") {
                const exif = readExifResolution(view, offset + 10);
                if (exif) { dpiX = exif.dpiX; dpiY = exif.dpiY; }
            }
        }
        if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
            height = view.getUint16(offset + 5);
            width = view.getUint16(offset + 7);
        }
        offset += 2 + length;
    }
    return { width, height, dpiX, dpiY, jfifOffset };
}

function readExifResolution(view, tiffStart) {
    try {
        const byteOrder = view.getUint16(tiffStart);
        const little = byteOrder === 0x4949;
        if (!little && byteOrder !== 0x4D4D) return null;
        const get16 = (o) => view.getUint16(o, little);
        const get32 = (o) => view.getUint32(o, little);
        if (get16(tiffStart + 2) !== 0x002A) return null;
        const ifd0Offset = tiffStart + get32(tiffStart + 4);
        const entryCount = get16(ifd0Offset);
        let xRes = null, yRes = null, resUnit = 2;
        for (let i = 0; i < entryCount; i++) {
            const entryOffset = ifd0Offset + 2 + i * 12;
            const tag = get16(entryOffset);
            const valueOffset = entryOffset + 8;
            if (tag === 0x011A || tag === 0x011B) {
                const dataOffset = tiffStart + get32(valueOffset);
                const numerator = get32(dataOffset);
                const denominator = get32(dataOffset + 4);
                const value = denominator ? numerator / denominator : null;
                if (tag === 0x011A) xRes = value; else yRes = value;
            }
            if (tag === 0x0128) resUnit = get16(valueOffset);
        }
        if (xRes === null && yRes === null) return null;
        const toDpi = (v) => resUnit === 3 ? Math.round(v * 2.54) : Math.round(v);
        return { dpiX: xRes !== null ? toDpi(xRes) : null, dpiY: yRes !== null ? toDpi(yRes) : null };
    } catch (e) { return null; }
}

export function buildJfifSegment(dpi) {
    const length = 16;
    const seg = new Uint8Array(2 + length);
    seg[0] = 0xFF; seg[1] = 0xE0;
    seg[2] = (length >> 8) & 0xFF; seg[3] = length & 0xFF;
    seg[4] = 0x4A; seg[5] = 0x46; seg[6] = 0x49; seg[7] = 0x46;
    seg[8] = 0x00; seg[9] = 0x01; seg[10] = 0x01; seg[11] = 0x01;
    seg[12] = (dpi >> 8) & 0xFF; seg[13] = dpi & 0xFF;
    seg[14] = (dpi >> 8) & 0xFF; seg[15] = dpi & 0xFF;
    seg[16] = 0x00; seg[17] = 0x00;
    return seg;
}

export function forceJpegDpi(arrayBuffer, dpi, jfifOffset) {
    const bytes = new Uint8Array(arrayBuffer);
    const newSegment = buildJfifSegment(dpi);
    if (jfifOffset !== null) {
        const existingLength = 2 + new DataView(arrayBuffer).getUint16(jfifOffset + 2);
        const before = bytes.slice(0, jfifOffset);
        const after = bytes.slice(jfifOffset + existingLength);
        const result = new Uint8Array(before.length + newSegment.length + after.length);
        result.set(before, 0);
        result.set(newSegment, before.length);
        result.set(after, before.length + newSegment.length);
        return result.buffer;
    }
    const before = bytes.slice(0, 2);
    const after = bytes.slice(2);
    const result = new Uint8Array(before.length + newSegment.length + after.length);
    result.set(before, 0);
    result.set(newSegment, before.length);
    result.set(after, before.length + newSegment.length);
    return result.buffer;
}
