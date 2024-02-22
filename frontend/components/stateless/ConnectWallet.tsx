import { Button } from "@mui/material";
import * as React from "react";
import { Item } from "./Item";

export interface ConnectWalletProps {
    connectWalletClick: () => Promise<void>;
}

export function ConnectWallet(props: ConnectWalletProps) {
    return <Item>
        <Button sx={{ marginTop: "10px", marginBottom: "10px" }} variant="contained" onClick={async () => await props.connectWalletClick()} >Connect your wallet</Button>
    </Item>
}