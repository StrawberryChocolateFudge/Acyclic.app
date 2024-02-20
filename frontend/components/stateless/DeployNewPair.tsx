import { Button, Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import * as React from "react";
import { TokenType } from "../../data";
import { TokenSelectorAutocomplete } from "./SelectMenus";


export interface NewPairProps {
    token1: TokenType;
    setToken1: (to: TokenType) => void;
    token1Amount: string;
    setToken1Amount: (to: string) => void;
    token2: TokenType;
    setToken2: (to: TokenType) => void;
    token2Amount: string;
    setToken2Amount: (to: string) => void;
    valuetokens: TokenType[];
    agphTokens: TokenType[];
    deploymentCost: string;
}

export function DeployNewPair(props: NewPairProps) {
    return <Stack direction="column" justifyContent="center">
        <Typography sx={{ margin: "0 auto", paddingBottom: "20px", paddingTop: "20px" }} variant="body1" component="div">You can combine tokens and derive new tokens from them! Create the ultimate portfolio while holding less tokens! <br /> The amount determines how much of the selected asset is wrapped into one new AGPH token.</Typography>

        <Divider />
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">The first token</Typography>
            <TokenSelectorAutocomplete selectedValue={props.token1} setSelectedValue={(val: TokenType) => { props.setToken1(val) }} tokens={props.valuetokens.concat(props.agphTokens)} ></TokenSelectorAutocomplete>
            <TextField
                value={props.token1Amount}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    props.setToken1Amount(event.target.value);
                }}

                type={"number"} autoComplete="off" label="Amount per token" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Divider sx={{ marginTop: "20px" }} />
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Second token</Typography>
            <TokenSelectorAutocomplete selectedValue={props.token2} setSelectedValue={(val: TokenType) => { props.setToken2(val) }} tokens={props.valuetokens.concat(props.agphTokens)}></TokenSelectorAutocomplete>
            <TextField
                value={props.token2Amount}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    props.setToken2Amount(event.target.value);
                }}

                type={"number"} autoComplete="off" label="Amount per token" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Divider sx={{ marginBottom: "10px" }} />
        <Typography sx={{}} variant="body1" component="div" >{props.deploymentCost}</Typography>
        <Button variant="contained" sx={{ marginTop: "20px", marginBottom: "20px  " }}>Deploy new pair</Button>
    </Stack>
}