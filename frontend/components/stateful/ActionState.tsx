import * as React from "react";
import { getDeploymentCostsForTokens, supportedAssetsPlaceHolder, TokenType, NETWORK, getTokenAddressFromSelectedName, AgphSelectOptions, getBalanceOf, getAllowanceAndBalanceOfTokens } from "../../data";
import { AGPHStruct, calculateDepositFeeForToken, convertDecimalNumberStringToRateAndDecimalShift } from "../../../lib/traverseDAG";
import { DeployNewPair, PairDeploymentSuccess } from "../stateless/DeployNewPair";
import { ActionTabs, TokenDepositCost, TOKENDEPOSITCOSTPLACEHOLDER } from "../stateless/ActionTabs";
import { AbiPath, contractAddresses, getContract, handleNetworkSelect, requestAccounts, watchAsset, handleOnAccountChanged } from "../../web3";
import { GraphStore_Interactor } from "../../web3/bindings";
import { ApprovalInfo, APPROVALINFOPLACEHOLDER } from "../stateless/WrapInteractions";
export interface AGPRActionsProps {
    selected: string,
    valuetokens: TokenType[],
    agphTokens: AgphSelectOptions,
    agphList: AGPHStruct[],
    feeDivider: number
}

export type ConnectedWallet = {
    address: string;
    isConnected: boolean;
}

const afterDeploymentPageRefreshTime = 10000;

const errorLogger = (msg: string) => console.error(msg);


export function AGPHActionState(props: AGPRActionsProps) {

    const [wrapUnwrapTab, setWrapUnwrapTab] = React.useState(0);

    // These are used for deployment and not wrapping unwrapping,for that I use the rpc
    const [token1, setToken1] = React.useState(supportedAssetsPlaceHolder[0]);
    const [token1Amount, setToken1Amount] = React.useState("");
    const [token2, setToken2] = React.useState(supportedAssetsPlaceHolder[0]);
    const [token2Amount, setToken2Amount] = React.useState("");

    const [loadingDeploymentCost, setLoadingDeploymentCost] = React.useState(false);

    const [deploymentCost, setDeploymentCost] = React.useState("");

    const [tokenMintAmount, setTokenMintAmount] = React.useState("");

    const [tokenDepositCost, setTokenDepositCost] = React.useState<TokenDepositCost>(TOKENDEPOSITCOSTPLACEHOLDER)

    const [tokenUnwrapAmount, setTokenUnwrapAmount] = React.useState("");


    const [pairDeploymentSuccess, setPairDeploymentSuccess] = React.useState(false);
    const [deployedPairName, setDeployedPairName] = React.useState("");

    const [connectedWallet, setConnectedWallet] = React.useState<ConnectedWallet>({ address: "", isConnected: false });
    const [selectedbalance, setSelectedbalance] = React.useState("");


    const [approvalInfo, setApprovalInfo] = React.useState<ApprovalInfo>(APPROVALINFOPLACEHOLDER);


    function refreshIn10Seconds() {
        setTimeout(() => {
            window.location.reload();
        }, afterDeploymentPageRefreshTime)
    }

    function renderRefreshTime() {
        return afterDeploymentPageRefreshTime / 1000;
    }

    async function connectWalletClick() {
        const provider = await handleNetworkSelect(NETWORK, console.error);
        const address = await requestAccounts(provider);
        setConnectedWallet({
            address,
            isConnected: true
        })
        handleOnAccountChanged((accounts: string[]) => {
            if (accounts.length === 0) {
                setConnectedWallet({
                    address: "",
                    isConnected: false
                })
            } else {
                setConnectedWallet({
                    address: accounts[0],
                    isConnected: true
                })
            }
        })
    }

    React.useEffect(() => {
        //Fetch balances and allowances for the token selected
    }, [connectedWallet, props.selected])

    async function deployNewPair() {
        const token1RateAndShift = convertDecimalNumberStringToRateAndDecimalShift(token1Amount);
        const token2RateAndShift = convertDecimalNumberStringToRateAndDecimalShift(token2Amount);

        const provider = await handleNetworkSelect(NETWORK, errorLogger);
        await requestAccounts(provider);
        const contract = await getContract(provider, contractAddresses[NETWORK].graphStore, AbiPath.GraphStore);
        const tx = await GraphStore_Interactor.createNewAGPH(contract, {
            token1Addr: token1.address,
            token1Rate: token1RateAndShift.rate,
            token1Decimals: token1RateAndShift.decimalShift,
            token2Addr: token2.address,
            token2Rate: token2RateAndShift.rate,
            token2Decimals: token2RateAndShift.decimalShift
        }, deploymentCost);

        await tx.wait().then(async (receipt) => {
            const APGH = await GraphStore_Interactor.filterNewAGPHEvent(contract, receipt);
            setDeployedPairName(APGH.agphName);
            setPairDeploymentSuccess(true);
            await watchAsset({
                address: APGH.agphAddress,
                symbol: APGH.agphSymbol,
                decimals: 18
            }, errorLogger);
            refreshIn10Seconds();
        })
    }

    React.useEffect(() => {
        async function fetchBalance() {
            const tokenAddr = getTokenAddressFromSelectedName(props.selected, props.agphTokens);
            const tokenBalance = await getBalanceOf(tokenAddr, connectedWallet.address)
            setSelectedbalance(tokenBalance);
        }

        async function fetchChildTokensDetails() {
            const agphAddr = getTokenAddressFromSelectedName(props.selected, props.agphTokens);
            const info = await getAllowanceAndBalanceOfTokens(connectedWallet.address, agphAddr);
            setApprovalInfo(info)
        }

        if (wrapUnwrapTab === 0 && connectedWallet.isConnected) {
            setApprovalInfo(APPROVALINFOPLACEHOLDER)
            fetchBalance();
            fetchChildTokensDetails();
        }

        if (wrapUnwrapTab === 1 && connectedWallet.isConnected) {
            fetchBalance();
        }


    }, [wrapUnwrapTab, props.selected, connectedWallet])

    React.useEffect(() => {
        async function getDeploymentCost() {
            setLoadingDeploymentCost(true);
            const cost = await getDeploymentCostsForTokens(token1.address, token2.address);
            setDeploymentCost(cost);
            setLoadingDeploymentCost(false);
        }

        if (token1.address !== "" && token2.address !== "") {
            getDeploymentCost()
        } else {
            setDeploymentCost("")
        }

    }, [token1, token2])





    React.useEffect(() => {

        console.log("token unwrap amount changed to", tokenUnwrapAmount)






    }, [tokenUnwrapAmount])

    async function refetchAllowanceApprovalInfo() {
        const agphAddr = getTokenAddressFromSelectedName(props.selected, props.agphTokens);
        const info = await getAllowanceAndBalanceOfTokens(connectedWallet.address, agphAddr);
        setApprovalInfo(info)
    }



    if (props.selected === "new") {

        if (pairDeploymentSuccess) {
            return <PairDeploymentSuccess newPairName={deployedPairName} refreshTime={renderRefreshTime()}></PairDeploymentSuccess>
        }


        return <DeployNewPair
            token1={token1}
            setToken1={(to: TokenType) => { setToken1(to) }}
            token1Amount={token1Amount}
            setToken1Amount={(to: string) => { setToken1Amount(to) }}
            token2={token2}
            setToken2={(to: TokenType) => { setToken2(to) }}
            token2Amount={token2Amount}
            setToken2Amount={(to: string) => setToken2Amount(to)}
            valuetokens={props.valuetokens}
            agphTokens={props.agphTokens}
            deploymentCost={deploymentCost}
            loadingDeploymentCost={loadingDeploymentCost}
            deployPair={deployNewPair}
        ></DeployNewPair>
    }

    return <ActionTabs
        connectedWallet={connectedWallet}
        connectWalletClick={connectWalletClick}
        selected={props.selected}
        selectedbalance={selectedbalance}
        agphList={props.agphList}
        wrapUnwrapTab={wrapUnwrapTab}
        setWrapUnwrapTab={setWrapUnwrapTab}
        token1={token1}
        token2={token2}
        tokenMintAmount={tokenMintAmount}
        setTokenMintAmount={setTokenMintAmount}
        tokenDepositCost={tokenDepositCost}
        tokenUnwrapAmount={tokenUnwrapAmount}
        setTokenUnwrapAmount={(to: string) => setTokenUnwrapAmount(to)}
        approvalInfo={approvalInfo}
        feeDivider={props.feeDivider}
        refetchApprovalInfo={refetchAllowanceApprovalInfo}
    ></ActionTabs>
}
