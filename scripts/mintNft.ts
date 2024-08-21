import { Address, beginCell, Cell, toNano } from '@ton/core';
import { NFT_Collection } from '../wrappers/NFT_Collection';
import { onchainItemContentToCell } from '../wrappers/NFT_Item';
import { NetworkProvider } from '@ton/blueprint';

const COLLECTION_ADDRESS: Address = Address.parse('kQDILOsmcZf3j_tl6WR-z79_pcQC6SqhCypDJdjwI7mW12-Y');
const NEW_NFT_OWNER_ADDRESS: Address = Address.parse('0QAAeHjRVfqPfRIjkPlxcv-OAffJUfAxWSu6RFli4FUeUCRn');

const metadata = {
    name: 'Cube #1',
    description: 'I am Cube',
    attributes: [{ trait_type: 'Rarity', value: 'Legendary' }, { trait_type: 'Cube is billionaire', value: 'False' }],
    image: 'https://cheihod.ru/upload/iblock/dcf/dcff3bb2f4c5162d1c4385b118c80d0f.jpg',
};

export async function run(provider: NetworkProvider) {
    const nft_item_metadata: Cell = await onchainItemContentToCell(metadata);

    const collection = provider.open(NFT_Collection.createFromAddress(COLLECTION_ADDRESS));

    const { next_item_index } = await collection.getCollectionData();

    const nft_item_content: Cell = beginCell().storeAddress(NEW_NFT_OWNER_ADDRESS).storeRef(nft_item_metadata).endCell();

    await collection.sendMintRequest(provider.sender(), toNano('0.05'), next_item_index, nft_item_content, toNano('0.03'));
}
