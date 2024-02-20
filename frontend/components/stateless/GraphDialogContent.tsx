import * as React from 'react';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Tree from 'react-d3-tree';
import { Stack, TextField } from '@mui/material';


export interface GraphDialogContentProps {
    open: boolean;
    onClose: () => void;
    topLevelAmount: string;
    setTopLevelAmount: (to: string) => void;
    orgChart: any;
}

export function GraphDialogContent(props: GraphDialogContentProps) {
    const { onClose, open } = props;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog fullScreen sx={{ width: "100%", height: "100%" }} onClose={handleClose} open={open}>
            <DialogTitle>Directed Acyclic Graph</DialogTitle>
            <Stack
                gap={2}
                direction={"row"}
                sx={{
                    marginLeft: "10px"
                }}
            >
                <TextField value={props.topLevelAmount} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    props.setTopLevelAmount(event.target.value);
                }}
                    label="Asset amount"></TextField>
                <Button size="small" variant="contained">
                    Refresh graph
                </Button>

            </Stack>
            <Button onClick={handleClose} variant="outlined" sx={{ width: "200px", marginLeft: "10px", marginTop: "10px" }}>
                Close
            </Button>
            <div id="treeWrapper" style={{ width: "100%", height: "100%", margin: "0 auto" }}>
                <Tree data={props.orgChart} translate={{ x: width / 4, y: height / 3 }} />
            </div>
        </Dialog>
    );
}