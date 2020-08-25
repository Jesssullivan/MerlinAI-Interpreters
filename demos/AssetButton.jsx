import React, { Component } from 'react'
import {IconButton} from '@material-ui/core';

export default class AssetButton extends Component {

    asset;  //  passed as prop, such as an svg icon drawing
    hintTrueString;  // add a helpful hint, appends on toggle
    id;  // pass an adjacent Document tag

    constructor(props) {
        super(props);
        this.state = {isToggleOn: false};
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick() {
        this.setState(state => ({
            isToggleOn: !state.isToggleOn
        }));
    }

    payload() {
            return (
                <IconButton id={this.id} onClick={this.handleClick}>
                    <img src={this.props.asset} alt={""}/>
                    {this.state.isToggleOn ? this.props.hintTrueString : this.props.hintFalseString}
                </IconButton>
            );
        }
    render = () => this.payload();
}
