import * as React from 'react';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { AGPHStruct } from '../../../lib/traverseDAG';
import { orgChart } from '../../data';
import { GraphDialogContent } from '../stateless/GraphDialogContent';


export interface GraphDialogStateProps {
    agpList: AGPHStruct[];
    symbol: string;

}

export default function GraphDialogState(props: GraphDialogStateProps) {
    const [open, setOpen] = React.useState(false);

    // THe DAG is generated using this top level amount first, then it can be updated by the component for different amounts
    const [topLevelAmount, setTopLevelAmount] = React.useState("1");

    const [loadingOrgChart, setLoadingOrgChart] = React.useState(true);

    const [dag, setDag] = React.useState(orgChart);


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setTopLevelAmount("1");
    };

    React.useEffect(() => {
        console.log('top level amount changed to', topLevelAmount)
    }, [topLevelAmount])


    React.useEffect(() => {
        console.log("on symbol change")
    }, [props.symbol])

    //TODO: Calculate here the DAG and fetch the value too

    // On recompute, recalculate the DAG and and the value

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
            />
        </div>
    );
}