import * as React from 'react';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Tree from 'react-d3-tree';
import { CircularProgress, Link, List, ListItem, ListItemButton, ListItemText, Stack, TextField, Typography } from '@mui/material';
import { explorerAddressPath } from '../../web3';
import { NETWORK } from '../../data';
import './customTree.css';
import { ValueContent } from '../../../lib/traverseDAG';
import { Item } from './Item';


export interface GraphDialogContentProps {
    open: boolean;
    onClose: () => void;
    topLevelAmount: string;
    setTopLevelAmount: (to: string) => void;
    orgChart: any;
    loadingOrgChart: boolean;
    topLevelAssetName: string;
    valueContent: ValueContent;
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
            <div style={{ position: "absolute", top: 0, left: 0, backgroundColor: "#2e2e2e", paddingBottom: "10px", paddingRight: "5px", borderBottomRightRadius: "5px" }}>
                <DialogTitle>Directed Acyclic Graph</DialogTitle>
                <Stack
                    gap={2}
                    direction={"row"}
                    sx={{
                        marginLeft: "10px",
                    }}
                >
                    <TextField type="number" value={props.topLevelAmount} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        props.setTopLevelAmount(event.target.value);
                    }}
                        label={`${props.topLevelAssetName} Asset amount`}></TextField>
                </Stack>
                <Button onClick={handleClose} variant="outlined" sx={{ width: "200px", marginLeft: "10px", marginTop: "10px" }}>
                    Close
                </Button>
                <Item>
                    <Typography variant="body1" component="div">Actual Value Content:</Typography>
                    <List dense={true}>
                        {props.valueContent?.map((val) => <ListItem key={val.address + val.amount + "valuelist"}>
                            <ListItemButton divider={true} target={"_blank"} href={explorerAddressPath[NETWORK] + val.address}>
                                <ListItemText
                                    primary={`${val.amount} ${val.name}`}
                                />
                            </ListItemButton>
                        </ListItem>)}
                    </List>
                </Item>

            </div>
            {props.loadingOrgChart ? <CircularProgress /> :
                <div id="treeWrapper" style={{ width: "100%", height: "100%", margin: "0 auto" }}>
                    <Tree
                        rootNodeClassName="node__root"
                        branchNodeClassName="node__branch"
                        leafNodeClassName="node__leaf"
                        zoomable={true}
                        collapsible={false}
                        data={props.orgChart}
                        translate={{ x: width / 4, y: height / 3 }} />
                </div>}
        </Dialog>
    );
}

