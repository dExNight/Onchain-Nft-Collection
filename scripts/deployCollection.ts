import { Address, Dictionary, Slice, toNano } from '@ton/core';
import { NFT_Collection } from '../wrappers/NFT_Collection';
import { compile, NetworkProvider } from '@ton/blueprint';

const OWNER_ADDRESS: Address = Address.parse('0QAAeHjRVfqPfRIjkPlxcv-OAffJUfAxWSu6RFli4FUeUCRn');

const metadata = {
    image: 'https://cryptorelax.org/wp-content/uploads/2021/07/chto_takoe_nft.png',
    name: 'Cube',
    description: 'Cube is a simple shape',
    social_links: ['https://t.me/dExNight'],
};

export async function run(provider: NetworkProvider) {
    const collection = provider.open(
        await NFT_Collection.createFromConfig(
            {
                owner_address: OWNER_ADDRESS,
                next_item_index: 0,
                collection_content: metadata,
                nft_item_code: await compile('NFT_Item'),
                royalty_params: {
                    numerator: 20,
                    denominator: 100,
                    destination_address: OWNER_ADDRESS,
                },
            },
            await compile('NFT_Collection'),
        ),
    );

    await collection.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(collection.address);
}
