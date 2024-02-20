import * as React from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { aggregateValueContent, AGPHStruct, Dag, generateDag, getValueContent } from '../../../lib/traverseDAG';
import { GraphDialogContent } from '../stateless/GraphDialogContent';


export interface GraphDialogStateProps {
    agpList: AGPHStruct[];
    symbol: string;

}

export default function GraphDialogState(props: GraphDialogStateProps) {
    const [open, setOpen] = React.useState(false);

    // THe DAG is generated using this top level amount first, then it can be updated by the component for different amounts
    const [topLevelAmount, setTopLevelAmount] = React.useState("1");

    const [loadingOrgChart, setLoadingOrgChart] = React.useState(false);

    const [dag, setDag] = React.useState<Dag>();


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setTopLevelAmount("1");
    };

    React.useEffect(() => {

        // if the topLevelAmount is not a number, then I return and don't rerender the chart
        if (isNaN(parseFloat(topLevelAmount))) {
            return;
        }

        setLoadingOrgChart(true);
        const dagOptions = generateDag(props.agpList, props.symbol, topLevelAmount);

        setDag(dagOptions.data)
        setLoadingOrgChart(false);

    }, [topLevelAmount])


    React.useEffect(() => {
        if (isNaN(parseFloat(topLevelAmount))) {
            console.log("Top level amount is whatnot")
            return;
        }

        const dagOptions = generateDag(props.agpList, props.symbol, topLevelAmount);

        setDag(dagOptions.data)


    }, [props.symbol])

    function getValueContent() {

        if (isNaN(parseFloat(topLevelAmount))) {
            return aggregateValueContent(dag, "1")
        }
        return aggregateValueContent(dag, topLevelAmount)
    }


    return (
        <div>
            <Typography variant="subtitle1" component="div">
            </Typography>
            <br />
            <Button variant="outlined" onClick={handleClickOpen}>
                Inspect DAG
            </Button>

            <GraphDialogContent
                open={open}
                onClose={handleClose}
                topLevelAmount={topLevelAmount}
                setTopLevelAmount={(to: string) => setTopLevelAmount(to)}
                orgChart={dag}
                loadingOrgChart={loadingOrgChart}
                topLevelAssetName={props.symbol}
                valueContent={getValueContent()}
            />
        </div>
    );
}