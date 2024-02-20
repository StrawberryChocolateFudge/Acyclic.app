import * as React from 'react';
import Stack from '@mui/material/Stack';
import { Button, Typography, Divider } from '@mui/material';
import { Item } from '../stateless/Item';
import { AbiPath, ChainIds, getContract, handleNetworkSelect, MintOnTestnet, requestAccounts, watchAsset } from '../../web3';
import { MintTestnetERC20Tokens } from '../../web3/bindings';




export function WeAreOnTestnet() {

    const errorLogger = (msg: string) => console.error(msg);

    async function MintToken(tokenName: string) {
        const token = MintOnTestnet[tokenName]
        const provider = await handleNetworkSelect(ChainIds.ARBITRUM_SEPOLINA_TESTNET, errorLogger);
        await requestAccounts(provider);
        const contract = await getContract(provider, token.address, AbiPath.TestERC20);
        const tx = await MintTestnetERC20Tokens.MintTestnetTokens(contract, token.amount);

        await tx.wait().then(async (receipt) => {
            await watchAsset({
                address: token.address,
                symbol: token.symbol,
                decimals: 18
            }, errorLogger);
        })
    }


    function loadMinter(tokenName: string) {
        return async () => await MintToken(tokenName);
    }

    return <Stack spacing={2} justifyContent="center" flexDirection="row" sx={{ marginBottom: "20px" }}>
        <Item>
            <Typography>We are on Arbitrum Sepolia Testnet!</Typography>

            <Typography>Mint testnet ERC-20 tokens to try out the application here:</Typography>
            <Stack justifyContent="space-between" flexDirection="row" sx={{ marginBottom: "10px" }}>
                <Button onClick={loadMinter("USD")} sx={{ width: "150px" }} variant="outlined">Mint USD</Button>
                <Button onClick={loadMinter("WBTC")} sx={{ width: "150px" }} variant="outlined" >Mint WBTC</Button>
            </Stack>
            <Stack justifyContent="space-between" flexDirection="row">
                <Button onClick={loadMinter("WToken")} sx={{ width: "150px" }} variant="outlined" >Mint WToken</Button>
                <Button onClick={loadMinter("EUR")} sx={{ width: "150px" }} variant="outlined" >Mint EUR</Button>
            </Stack>
        </Item>
    </Stack>
}