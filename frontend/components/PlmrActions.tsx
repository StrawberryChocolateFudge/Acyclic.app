import { Autocomplete, Box, Button, Divider, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import * as React from "react";
import GraphDialog from "./GraphDialog";

export interface PLMRActionsProps {
    selected: string,
}
interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function Deposit(props: any) {
    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Mint new PLMR. Deposit tokens to create new.</Typography>
            <TextField label="Mint amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }}></TextField>
        </Paper>
        <Typography variant="subtitle1" component="div">To deposit tokens first you need to approve spend for both!</Typography>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Approve token 1</Button>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Approve token 2</Button>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Deposit</Button>
    </Stack>
}

function DepositZETA(props: any) {
    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Wrap ZETA</Typography>
            <TextField label="Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }}></TextField>
        </Paper>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Wrap</Button>
    </Stack>
}

function WithdrawZETA(props: any) {
    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Unwrap WZETA.</Typography>
            <TextField label="Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Unwrap</Button>
    </Stack>
}

function Withdraw(props: any) {
    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Redeem a PLMR token. Burn it and recieve the assets backing it.</Typography>
            <TextField label="Redeem Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Typography variant="subtitle1" component="div">After redeeming you will have both tokens transferred to your account!</Typography>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Redeem</Button>
    </Stack>
}

function FlashLoan(props: any) {
    return <Stack direction="column" justifyContent={"center"}>
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">ERC-3156: Flash Loans available</Typography>
            <Typography variant="body2" component="div">Fee: 0.2%</Typography>
            <Typography variant="body2" component="div">Available for loan: 11579208923731619542357098500868 PLMR3</Typography>
            <Button variant="contained" sx={{ marginTop: "20px" }}>Docs</Button>
        </Paper>
    </Stack>
}


export function PLMRActions(props: PLMRActionsProps) {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    if (props.selected === "new") {
        return <Stack direction="column" justifyContent="center" sx={{ marginTop: "20px" }}>
            <Typography sx={{ margin: "0 auto", paddingBottom: "20px" }} variant="body1" component="div">You can combine tokens and derive new tokens from them! Create the ultimate portfolio while holding less tokens!</Typography>
            <Divider />
            <Paper sx={{ padding: "20px" }}>
                <Typography variant="body1" component="div">The first token</Typography>
                <TokenSelectorAutocomplete></TokenSelectorAutocomplete>
                <TextField type={"number"} autoComplete="off" label="Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
            </Paper>
            <Divider sx={{ marginTop: "20px" }} />
            <Paper sx={{ padding: "20px" }}>
                <Typography variant="body1" component="div">Second token</Typography>
                <TokenSelectorAutocomplete></TokenSelectorAutocomplete>
                <TextField type={"number"} autoComplete="off" label="Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
            </Paper>

            <Button variant="contained" sx={{ marginTop: "20px" }}>Create new derivative (PLMR)</Button>
        </Stack>
    } else if (props.selected === "WZETA") {
        return <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1" component="div">Wrap Zeta</Typography>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Wrap" />
                    <Tab label="Unwrap" />
                    <Tab label="Flash Loan" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <DepositZETA></DepositZETA>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <WithdrawZETA></WithdrawZETA>
            </TabPanel>
            <TabPanel value={value} index={2}>
                <FlashLoan></FlashLoan>
            </TabPanel>
        </Box>
    } else if (props.selected === "PLMRX") {
        return <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="body1" component="div">Wrap Zeta</Typography>
                <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                    <Tab label="Buy" />
                    <Tab label="Flash Loan" />
                </Tabs>
            </Box>
            <TabPanel value={value} index={0}>
                <Typography sx={{ margin: "0 auto", paddingBottom: "20px" }} variant="body1" component="div">Polymer X</Typography>
                <Typography sx={{ margin: "0 auto", paddingBottom: "20px" }} variant="subtitle2" component="div">Token Sale</Typography>
                <TextField type={"number"} autoComplete="off" label="Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }}></TextField>
                <Button>Buy</Button>            </TabPanel>
            <TabPanel value={value} index={1}>
                <FlashLoan></FlashLoan>
            </TabPanel>
        </Box>
    }


    return <Box sx={{ width: '100%' }}>
        <Box>
            <GraphDialog></GraphDialog>
        </Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
                <Tab label="Deposit" />
                <Tab label="Withdraw" />
                <Tab label="Flash Loan" />
            </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
            <Deposit></Deposit>
        </TabPanel>
        <TabPanel value={value} index={1}>
            <Withdraw></Withdraw>
        </TabPanel>
        <TabPanel value={value} index={2}>
            <FlashLoan></FlashLoan>
        </TabPanel>
    </Box>
}

function TokenSelectorAutocomplete() {
    return (
        <Autocomplete
            disablePortal
            options={tokens}
            sx={{ width: "100%", marginTop: "10px" }}
            renderInput={(params) => <TextField label="Address" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} {...params} />}
            getOptionLabel={option => option.address}
            renderOption={(props, option) => (<Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                <img
                    loading="lazy"
                    width="20"
                    src={option.logo}
                />
                {option.name} {option.address}
            </Box>)}
        />
    );
}

interface TokenType {
    address: string,
    name: string,
    logo: string

}

const tokens = [
    { name: "WZETA", address: "wrappedZeta", logo: "/imgs/logo.png" },
    { name: "PLMRX", address: "plmrx token address", logo: "/imgs/logo.png" },
    { name: "PLMR1", address: "0xtokenaddress1", logo: "/imgs/logo.png" },
    { name: "PLMR2", address: "0xtokenaddress2", logo: "/imgs/logo.png" },
    { name: "PLMR3", address: "0xtokenaddress3", logo: "/imgs/logo.png" },
    { name: "PLMR4", address: "0xtokenaddress4", logo: "/imgs/logo.png" },

];