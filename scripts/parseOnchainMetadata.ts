import { Address, Dictionary, Slice } from '@ton/core';
import { NFT_Collection } from '../wrappers/NFT_Collection';
import { NetworkProvider } from '@ton/blueprint';
import { NFTDictValueSerializer } from '../utils/serializers';
import { sha256 } from 'ton-crypto';

const COLLECTION_ADDRESS: Address = Address.parse('kQCT_ikHlV2b0syKw3FVxC_r5S1hK45OSz7_ZWBz_16JO0Td');

export async function run(provider: NetworkProvider) {
    const collection = provider.open(NFT_Collection.createFromAddress(COLLECTION_ADDRESS));

    const { content } = await collection.getCollectionData();

    const cell_slice: Slice = content.beginParse();
    const flag: number = cell_slice.loadUint(8);

    if (flag != 0) {
        throw new Error('Invalid flag');
    }
    console.log(1);
    const dict = cell_slice.loadDict(Dictionary.Keys.Buffer(32), NFTDictValueSerializer);
    console.log(2);

    const keys = ['image', 'name', 'description'];
    for (const key of keys) {
        console.log(3);
        const dictKey = await sha256(key);
        console.log(4);
        const dictValue = dict.get(dictKey);
        console.log(5);
        if (dictValue) {
            console.log(`${dictValue.content.toString('utf-8')}`);
        }
    }
}
