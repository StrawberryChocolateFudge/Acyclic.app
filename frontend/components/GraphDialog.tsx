import * as React from 'react';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import Tree from 'react-d3-tree';

// This is a simplified example of an org chart with a depth of 2.
// Note how deeper levels are defined recursively via the `children` property.
const orgChart = {
    name: 'PLMR2',
    children: [

        {
            name: 'PLMR1',
            attributes: {
                Amount: '1',
            },
            children: [
                {
                    name: "USDC",
                    attributes: {
                        Amount: "100"
                    }
                },
                {
                    name: "WETH",
                    attributes: {
                        Amount: "0.001"
                    }

                }
            ]
        },
        {
            name: 'ETH',
            attributes: {
                Amount: '0.01',
            },
        },

    ],
};





export interface SimpleDialogProps {
    open: boolean;
    onClose: () => void;
}

function SimpleDialog(props: SimpleDialogProps) {
    const { onClose, open } = props;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog fullScreen sx={{ width: "100%", height: "100%" }} onClose={handleClose} open={open}>
            <DialogTitle>Directed Acyclic Graph </DialogTitle>
            <div id="treeWrapper" style={{ width: "100%", height: "100%" }}>
                <Tree data={orgChart} translate={{ x: width / 4, y: height / 3 }} />
            </div>
            <Button onClick={handleClose}>Close</Button>
        </Dialog>
    );
}

export interface GraphDialogProps { }

export default function GraphDialog(props: GraphDialogProps) {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    return (
        <div>
            <Typography variant="subtitle1" component="div">
            </Typography>
            <br />
            <Button variant="outlined" onClick={handleClickOpen}>
                Inspect
            </Button>
            <SimpleDialog
                open={open}
                onClose={handleClose}
            />
        </div>
    );
}