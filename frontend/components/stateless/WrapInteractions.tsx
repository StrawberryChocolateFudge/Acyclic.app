import { Button, Paper, Stack, TextField, Typography } from "@mui/material";
import * as React from "react";
import { TokenType } from "../../data";


interface WrapProps {
    token1: TokenType;
    token2: TokenType;
    tokenMintAmount: string;
    setTokenMintAmount: (to: string) => void;
    tokenDepositCost: { wrappedAmount: string, depositFee: string, totalDeposit: string };
}

export function Wrap(props: WrapProps) {
    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Mint a new AGPH token by wrapping tokens.</Typography>
            <TextField label="Mint Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }}></TextField>
        </Paper>
        <Typography variant="subtitle1" component="div">To deposit tokens first you need to approve spend for both!</Typography>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Approve token 1</Button>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Approve token 2</Button>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Deposit</Button>
    </Stack>
}

interface UnWrapProps { }

export function UnWrap(props: UnWrapProps) {
    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Unwrap a token. Burn it and recieve the assets backing it.</Typography>
            <TextField label="Unwrap Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Typography variant="subtitle1" component="div">After unwrapping you will have both tokens transferred to your account!</Typography>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Unwrap</Button>
    </Stack>
}

