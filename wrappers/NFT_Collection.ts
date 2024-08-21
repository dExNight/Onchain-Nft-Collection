import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
} from '@ton/core';
import { sha256 } from 'ton-crypto';
import { NFTDictValueSerializer } from '../utils/serializers';

const ONCHAIN_CONTENT_PREFIX = 0x00;

export type OnchainCollectionContent = {
    metadata: Record<string, string>;
};

export type RoyaltyParams = {
    numerator: number;
    denominator: number;
    destination_address: Address;
};

export type MainConfig = {
    owner_address: Address;
    next_item_index: number;
    collection_content: OnchainCollectionContent;
    nft_item_code: Cell;
    royalty_params: RoyaltyParams;
};

export async function onchainCollectionContentToCell(content: OnchainCollectionContent): Promise<Cell> {
    const metadata_dictionary: Record<string, string> = content.metadata;
    let metadata = Dictionary.empty(Dictionary.Keys.Buffer(32), NFTDictValueSerializer);

    for (const key in metadata_dictionary) {
        const key_hash: Buffer = await sha256(key);
        metadata = metadata.set(key_hash, { content: Buffer.from(metadata_dictionary[key]) });
    }

    const onchain_data: Cell = beginCell().storeUint(ONCHAIN_CONTENT_PREFIX, 8).storeDict(metadata).endCell();

    return onchain_data;
}

export function royaltyParamsToCell(params: RoyaltyParams): Cell {
    return beginCell()
        .storeUint(params.numerator, 16)
        .storeUint(params.denominator, 16)
        .storeAddress(params.destination_address)
        .endCell();
}

export async function mainConfigToCell(config: MainConfig): Promise<Cell> {
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

    static async createFromConfig(config: MainConfig, code: Cell, workchain = 0) {
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
}
