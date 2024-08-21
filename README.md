# Onchain Nft Collection

## Description
This project aims to show TON developer how to create NFT collection with **on-chain** metadata

## Project structure
-   `contracts` - source code
-   `wrappers` - wrappers with onchain content serlialization
-   `utils` - onchain metadata serialization functions
-   `scripts` - scripts for onchain deployment and interaction

## Important notes

### `makeSnakeCell` and `flattenSnakeCell` possible replacement
In `@ton/core` there are functions for **Builder** and **Slice**:
- `loadStringTail`
- `storeStringTail`

Since they serialize/deserialize string value in the same way as `makeSnakeCell` and `flattenSnakeCell`, they are interchangeable (if the value to store is string).

**Check tests for detailed usage**

### Collection contract
- `get_collection_data` returns content cell that is stored in its storage, not common content (as it is in off-chain metadata)
```c
(int, cell, slice) get_collection_data() method_id {
    var (owner_address, next_item_index, content, _, _) = load_data();
    return (next_item_index, content, owner_address);
}
```

- `get_nft_content` returns NFT item content that is passed as argument
```c
cell get_nft_content(int index, cell individual_nft_content) method_id {
    return (individual_nft_content);
}
```

## References

Read more about metadata processing: https://docs.ton.org/develop/dapps/asset-processing/metadata