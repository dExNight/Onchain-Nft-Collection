import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, Dictionary, Slice, toNano } from '@ton/core';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { flattenSnakeCell, makeSnakeCell } from '../utils/onchainContentUtils';
import { NFTDictValueSerializer } from '../utils/serializers';
import { sha256 } from 'ton-crypto';

const SNAKE_CELL_PREFIX: number = 0x00;

describe('A', () => {
    let code: Cell;

    beforeAll(async () => {});

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;

    const stringToStore: string = 'hello world my name is Cube';

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
    });

    it('should pass', async () => {
        let data = Buffer.from(stringToStore);
        const snakeCellPrefix = Buffer.from([SNAKE_CELL_PREFIX]);
        data = Buffer.concat([snakeCellPrefix, data]);

        const snakedCell: Cell = makeSnakeCell(data);
        const cs: Slice = snakedCell.beginParse();

        const start = cs.loadUint(8);
        if (start === 0) {
            // const snake = flattenSnakeCell(cs.asCell());
            // console.log(snake.toString());
            console.log(cs.loadStringTail());
        }

        let dict = Dictionary.empty(Dictionary.Keys.Buffer(32), NFTDictValueSerializer);

        const keys = ['image', 'name', 'description'];
        for (const key of keys) {
            const dictKey = await sha256(key);
            dict = dict.set(dictKey, { content: Buffer.from(stringToStore) });
        }

        console.log(dict.size);
        console.log(dict.get(await sha256('image'))?.content.toString());
    });
});
