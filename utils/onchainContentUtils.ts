import { beginCell, BitBuilder, BitReader, Builder, Cell, Dictionary, Slice } from '@ton/core';
import { ChunkDictValueSerializer } from './serializers';

const OFF_CHAIN_CONTENT_PREFIX = 0x01;

export function flattenSnakeCell(cell: Cell) {
    let c: Cell | null = cell;

    const bitResult = new BitBuilder();
    while (c) {
        const cs = c.beginParse();
        if (cs.remainingBits === 0) {
            break;
        }

        const data = cs.loadBits(cs.remainingBits);
        bitResult.writeBits(data);
        c = c.refs && c.refs[0];
    }

    const endBits = bitResult.build();
    const reader = new BitReader(endBits);

    return reader.loadBuffer(reader.remaining / 8);
}

export function bufferToChunks(buff: Buffer, chunkSize: number) {
    const chunks: Buffer[] = [];
    while (buff.byteLength > 0) {
        chunks.push(buff.subarray(0, chunkSize));
        // eslint-disable-next-line no-param-reassign
        buff = buff.subarray(chunkSize);
    }
    return chunks;
}

export function makeSnakeCell(data: Buffer): Cell {
    const chunks = bufferToChunks(data, 127);

    if (chunks.length === 0) {
        return beginCell().endCell();
    }

    if (chunks.length === 1) {
        return beginCell().storeBuffer(chunks[0]).endCell();
    }

    let curCell = beginCell();

    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];

        curCell.storeBuffer(chunk);
        
        if (i - 1 >= 0) {
            const nextCell = beginCell();
            nextCell.storeRef(curCell);
            curCell = nextCell;
        }
    }

    return curCell.endCell();
}

export function encodeOffChainContent(content: string) {
    let data = Buffer.from(content);
    const offChainPrefix = Buffer.from([OFF_CHAIN_CONTENT_PREFIX]);
    data = Buffer.concat([offChainPrefix, data]);
    return makeSnakeCell(data);
}

export function ParseChunkDict(cell: Slice): Buffer {
    const dict = cell.loadDict(Dictionary.Keys.Uint(32), ChunkDictValueSerializer);

    let buf = Buffer.alloc(0);
    for (const [_, v] of dict) {
        buf = Buffer.concat([buf, v.content]);
    }
    return buf;
}
