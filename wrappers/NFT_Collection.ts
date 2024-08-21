import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode, TupleBuilder } from '@ton/core';
import { sha256 } from 'ton-crypto';
import { NFTDictValueSerializer } from '../utils/serializers';

const ONCHAIN_CONTENT_PREFIX = 0x00;

export type OnchainCollectionContent = {
    image: string;
    name: string;
    description: string;
    social_links: string[] | null;
};

export type RoyaltyParams = {
    numerator: number;
    denominator: number;
    destination_address: Address;
};

export type CollectionConfig = {
    owner_address: Address;
    next_item_index: number;
    collection_content: OnchainCollectionContent;
    nft_item_code: Cell;
    royalty_params: RoyaltyParams;
};

export async function onchainCollectionContentToCell(content: OnchainCollectionContent): Promise<Cell> {
    const metadata: Record<string, { content: Buffer }> = {
        image: { content: Buffer.from(content.image) },
        name: { content: Buffer.from(content.name) },
        description: { content: Buffer.from(content.description) },
        social_links: { content: Buffer.from(JSON.stringify(content.social_links)) },
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

export function royaltyParamsToCell(params: RoyaltyParams): Cell {
    return beginCell()
        .storeUint(params.numerator, 16)
        .storeUint(params.denominator, 16)
        .storeAddress(params.destination_address)
        .endCell();
}

export async function mainConfigToCell(config: CollectionConfig): Promise<Cell> {
    let contentCell = await onchainCollectionContentToCell(config.collection_content);

    const royaltyCell = royaltyParamsToCell(config.royalty_params);

    return beginCell()
        .storeAddress(config.owner_address)
        .storeUint(config.next_item_index, 64)
        .storeRef(contentCell)
        .storeRef(config.nft_item_code)
        .storeRef(royaltyCell)
        .endCell();
}

export class NFT_Collection implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new NFT_Collection(address);
    }

    static async createFromConfig(config: CollectionConfig, code: Cell, workchain = 0) {
        const data = await mainConfigToCell(config);
        const init = { code, data };
        return new NFT_Collection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMintRequest(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        item_index: number,
        nft_content: Cell,
        forward_amount: bigint,
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(1, 32)
                .storeUint(666, 64)
                .storeUint(item_index, 64)
                .storeCoins(forward_amount)
                .storeRef(nft_content)
                .endCell(),
        });
    }

    async sendTransaction(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getCollectionData(provider: ContractProvider) {
        const result = (await provider.get('get_collection_data', [])).stack;
        return {
            next_item_index: result.readNumber(),
            content: result.readCell(),
            owner_address: result.readAddress(),
        };
    }

    async getNftContent(provider: ContractProvider, index: number, individual_nft_content: Cell) {
        const tupleBuilder = new TupleBuilder();
        tupleBuilder.writeNumber(index);
        tupleBuilder.writeCell(individual_nft_content);

        const result = (await provider.get('get_nft_content', tupleBuilder.build())).stack;
        return {
            content: result.readCell(),
        };
    }
}
