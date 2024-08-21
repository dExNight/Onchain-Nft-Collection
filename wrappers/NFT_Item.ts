import { Address, beginCell, Cell, Contract, ContractProvider, Dictionary } from '@ton/core';
import { sha256 } from 'ton-crypto';
import { NFTDictValueSerializer } from '../utils/serializers';

const ONCHAIN_CONTENT_PREFIX = 0x00;

type Attribute = {
    trait_type: string;
    value: string;
};

export type OnchainItemContent = {
    image: string;
    name: string;
    description: string;
    attributes: Attribute[];
};

export async function onchainItemContentToCell(content: OnchainItemContent): Promise<Cell> {
    const metadata: Record<string, { content: Buffer }> = {
        image: { content: Buffer.from(content.image) },
        name: { content: Buffer.from(content.name) },
        description: { content: Buffer.from(content.description) },
        attributes: { content: Buffer.from(JSON.stringify(content.attributes)) },
    };

    const metadataDict = await Object.entries(metadata).reduce(
        async (dict, [key, value]) => {
            const keyHash = await sha256(key);
            return (await dict).set(keyHash, value);
        },
        Promise.resolve(Dictionary.empty(Dictionary.Keys.Buffer(32), NFTDictValueSerializer)),
    );

    return beginCell().storeUint(ONCHAIN_CONTENT_PREFIX, 8).storeDict(metadataDict).endCell();
}

export class NFT_Item implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new NFT_Item(address);
    }

    async getNftData(provider: ContractProvider) {
        const result = (await provider.get('get_nft_data', [])).stack;
        return {
            init: result.readNumber(),
            index: result.readNumber(),
            collection_address: result.readAddress(),
            owner_address: result.readAddress(),
            content: result.readCell(),
        };
    }
}
