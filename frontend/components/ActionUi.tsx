import { Autocomplete, Box, Button, Divider, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import * as React from "react";
import GraphDialog from "./GraphDialog";
import { supportedAssetsPlaceHolder, TokenType } from "../data";
import { TokenSelectorAutocomplete } from "./SelectMenus";
import { AGPHStruct, generateDag, getAGPHArrayIndex, getAGPHIndex, Result } from "../../lib/traverseDAG";

export interface AGPRActionsProps {
    selected: string,
    valuetokens: TokenType[],
    agphTokens: TokenType[],
    agphList: AGPHStruct[]
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


export function AGPHActions(props: AGPRActionsProps) {

    const [wrapUnwrapTab, setWrapUnwrapTab] = React.useState(0);

    const [token1, setToken1] = React.useState(supportedAssetsPlaceHolder[0]);
    const [token1Amount, setToken1Amount] = React.useState("");
    const [token2, setToken2] = React.useState(supportedAssetsPlaceHolder[0]);
    const [token2Amount, setToken2Amount] = React.useState("");

    const [deploymentCost, setDeploymentCost] = React.useState("");

    const [tokenMintAmount, setTokenMintAmount] = React.useState("");

    const [tokenDepositCost, setTokenDepositCost] = React.useState({ wrappedAmount: "", depositFee: "", totalDeposit: "" })

    const [tokenUnwrapAmount, setTokenUnwrapAmount] = React.useState("");

    const [dag, setDag] = React.useState<AGPHStruct | undefined>(undefined);

    React.useEffect(() => {
        async function getDeploymentCost() {
            //TODO:
            const cost = "0"
            setDeploymentCost(`Deployment Cost: ${"0"} ETH`);
        }

        if (token1.address !== "" && token2.address !== "") {
            getDeploymentCost()
        } else {
            setDeploymentCost("Creating new pairs that already exist will have added fees.")
        }

    }, [token1, token2])

    React.useEffect(() => {
console.log(props.selected)
        // if (props.selected !== "new") {
        //  const dagOption = generateDag(props.agphList,props.selected)
        // }


    }, [props.selected])


    if (props.selected === "new") {
        return <Stack direction="column" justifyContent="center">
            <Typography sx={{ margin: "0 auto", paddingBottom: "20px", paddingTop: "20px" }} variant="body1" component="div">You can combine tokens and derive new tokens from them! Create the ultimate portfolio while holding less tokens! <br /> The amount determines how much of the selected asset is wrapped into one new AGPH token.</Typography>

            <Divider />
            <Paper sx={{ padding: "20px" }}>
                <Typography variant="body1" component="div">The first token</Typography>
                <TokenSelectorAutocomplete selectedValue={token1} setSelectedValue={(val: TokenType) => { setToken1(val) }} tokens={props.valuetokens.concat(props.agphTokens)} ></TokenSelectorAutocomplete>
                <TextField
                    value={token1Amount}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setToken1Amount(event.target.value);
                    }}

                    type={"number"} autoComplete="off" label="Amount per token" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
            </Paper>
            <Divider sx={{ marginTop: "20px" }} />
            <Paper sx={{ padding: "20px" }}>
                <Typography variant="body1" component="div">Second token</Typography>
                <TokenSelectorAutocomplete selectedValue={token2} setSelectedValue={(val: TokenType) => { setToken2(val) }} tokens={props.valuetokens.concat(props.agphTokens)}></TokenSelectorAutocomplete>
                <TextField
                    value={token2Amount}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setToken2Amount(event.target.value);
                    }}

                    type={"number"} autoComplete="off" label="Amount per token" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
            </Paper>
            <Divider sx={{ marginBottom: "10px" }} />
            <Typography sx={{}} variant="body1" component="div" >{deploymentCost}</Typography>
            <Button variant="contained" sx={{ marginTop: "20px", marginBottom: "20px  " }}>Deploy new pair</Button>
        </Stack>
    }


    return <Box sx={{ width: '100%' }}>
        <Box>
            <GraphDialog></GraphDialog>
        </Box>
        <Box>
            <p>TODO; show contents of the token with dollar value</p>

        </Box>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={wrapUnwrapTab} onChange={(event: React.SyntheticEvent, newValue: number) => {
                setWrapUnwrapTab(newValue);
            }} aria-label="basic tabs example">
                <Tab label="Wrap" />
                <Tab label="Unwrap" />

            </Tabs>
        </Box>
        <TabPanel value={wrapUnwrapTab} index={0}>
            <Wrap
                token1={token1}
                token2={token2}
                tokenMintAmount={tokenMintAmount}
                setTokenMintAmount={(to: string) => setTokenMintAmount(to)}
                tokenDepositCost={tokenDepositCost}
            ></Wrap>
        </TabPanel>
        <TabPanel value={wrapUnwrapTab} index={1}>
            <UnWrap></UnWrap>
        </TabPanel>
    </Box >
}

interface WrapProps {
    token1: TokenType;
    token2: TokenType;
    tokenMintAmount: string;
    setTokenMintAmount: (to: string) => void;
    tokenDepositCost: { wrappedAmount: string, depositFee: string, totalDeposit: string };
}

function Wrap(props: WrapProps) {
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

function UnWrap(props: UnWrapProps) {
    return <Stack direction="column" justifyContent="center">
        <Paper sx={{ padding: "20px" }}>
            <Typography variant="body1" component="div">Unwrap a token. Burn it and recieve the assets backing it.</Typography>
            <TextField label="Unwrap Amount" variant="outlined" sx={{ width: "100%", marginTop: "10px" }} />
        </Paper>
        <Typography variant="subtitle1" component="div">After unwrapping you will have both tokens transferred to your account!</Typography>
        <Button variant="contained" sx={{ marginTop: "20px" }}>Unwrap</Button>
    </Stack>
}

