import React from 'react';
import Container from '@material-ui/core/Container';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import ProTip from './ProTip';
import Copyright from "./Copyright";
import VTime from "./Miguel";
import RecordView from "./RecordView";

export default function App() {
    return (
        <Container maxWidth="sm">

            <RecordView/>

        </Container>
    );
}