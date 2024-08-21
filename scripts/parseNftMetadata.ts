import { Address, Dictionary, Slice } from '@ton/core';
import { NFT_Collection } from '../wrappers/NFT_Collection';
import { NFT_Item } from '../wrappers/NFT_Item';
import { NetworkProvider } from '@ton/blueprint';
import { NFTDictValueSerializer } from '../utils/serializers';
import { sha256 } from 'ton-crypto';

const COLLECTION_ADDRESS: Address = Address.parse('kQDILOsmcZf3j_tl6WR-z79_pcQC6SqhCypDJdjwI7mW12-Y');
const ITEM_ADDRESS: Address = Address.parse('kQBgV9irY1SR_lY58r4oZVJpT7UasL8PbpHHZLpP1xB3sMrE');

export async function run(provider: NetworkProvider) {
    const collection = provider.open(NFT_Collection.createFromAddress(COLLECTION_ADDRESS));
    const item = provider.open(NFT_Item.createFromAddress(ITEM_ADDRESS));

    const { content: nft_item_content } = await item.getNftData();
    const { content } = await collection.getNftContent(0, nft_item_content);

    const cell_slice = content.beginParse();
    const flag = cell_slice.loadUint(8);

    if (flag != 0) {
        throw new Error('Invalid flag');
    }
    const dict = cell_slice.loadDict(Dictionary.Keys.Buffer(32), NFTDictValueSerializer);

    const keys = ['image', 'name', 'description'];
    for (const key of keys) {
        const dictKey = await sha256(key);
        const dictValue = dict.get(dictKey);
        if (dictValue) {
            console.log(`${dictValue.content.toString('utf-8')}`);
        }
    }
}
