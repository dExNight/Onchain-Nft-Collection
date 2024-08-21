import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { beginCell, Cell, Dictionary, Slice, toNano } from '@ton/core';
import '@ton/test-utils';
import { flattenSnakeCell, makeSnakeCell } from '../utils/onchainContentUtils';
import { NFTDictValueSerializer, stringToSnakeBuffer } from '../utils/serializers';
import { sha256 } from 'ton-crypto';

const SNAKE_CELL_PREFIX: number = 0x00;

describe('utils', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;

    const stringToStore: string = 'hello world my name is Cube';

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
    });

    it('makeSnakeCell && flattenSnakeCell', async () => {
        const snakeBuffer = stringToSnakeBuffer(stringToStore);
        const snakedCell: Cell = makeSnakeCell(snakeBuffer);
        const cs: Slice = snakedCell.beginParse();

        const start = cs.loadUint(8);
        if (start === 0) {
            const snake = flattenSnakeCell(cs.asCell());
            console.log(snake.toString());
        }

        let dict = Dictionary.empty(Dictionary.Keys.Buffer(32), NFTDictValueSerializer);

        const keys = ['image', 'name', 'description'];
        for (const key of keys) {
            const dictKey = await sha256(key);
            dict = dict.set(dictKey, { content: Buffer.from(stringToStore) });
        }

        expect(dict.get(await sha256('image'))?.content.toString()).toEqual(stringToStore);
    });

    it('makeSnakeCell && loadStringTail', async () => {
        const snakeBuffer = stringToSnakeBuffer(stringToStore);
        const snakedCell: Cell = makeSnakeCell(snakeBuffer);

        const cs: Slice = snakedCell.beginParse();

        const start = cs.loadUint(8);
        if (start === 0) {
            expect(cs.loadStringTail()).toEqual(stringToStore);
        }
    });

    it('storeStringTail && loadStringTail', async () => {
        const snakedCell: Cell = beginCell().storeUint(0, 8).storeStringTail(stringToStore).endCell();
        const cs: Slice = snakedCell.beginParse();

        const start = cs.loadUint(8);
        if (start === 0) {
            expect(cs.loadStringTail()).toEqual(stringToStore);
        }
    });

    it('storeStringTail && flattenSnakeCell', async () => {
        const snakedCell: Cell = beginCell().storeUint(0, 8).storeStringTail(stringToStore).endCell();
        const cs: Slice = snakedCell.beginParse();

        const start = cs.loadUint(8);
        if (start === 0) {
            const snake = flattenSnakeCell(cs.asCell());
            expect(snake.toString()).toEqual(stringToStore);
        }
    });
});
