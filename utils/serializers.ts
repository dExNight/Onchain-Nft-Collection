import { beginCell, Builder, Dictionary, Slice } from '@ton/core';
import { flattenSnakeCell, makeSnakeCell, ParseChunkDict, bufferToChunks } from './onchainContentUtils';

const SNAKE_CELL_PREFIX: number = 0x00;

interface ChunkDictValue {
    content: Buffer;
}

interface NFTDictValue {
    content: Buffer;
}

export const ChunkDictValueSerializer = {
    serialize(src: ChunkDictValue, builder: Builder) {},
    parse(src: Slice): ChunkDictValue {
        const snake = flattenSnakeCell(src.loadRef());
        return { content: snake };
    },
};

export const NFTDictValueSerializer = {
    serialize(src: NFTDictValue, builder: Builder) {
        const snakeCellPrefix = Buffer.from([SNAKE_CELL_PREFIX]);
        const data = Buffer.concat([snakeCellPrefix, src.content]);
        const cell = makeSnakeCell(data);
        builder.storeRef(cell);
    },
    parse(src: Slice): NFTDictValue {
        const ref = src.loadRef().asSlice();

        const start = ref.loadUint(8);
        if (start === 0) {
            const snake = flattenSnakeCell(ref.asCell());
            return { content: snake };
        }

        if (start === 1) {
            return { content: ParseChunkDict(ref) };
        }

        return { content: Buffer.from([]) };
    },
};
