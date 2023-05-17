import React, { Component } from 'react';
import { COORD_DECIMALS } from 'client_config';

export default class Coordinate extends Component {

    constructor (props) {
        super(props);
    }

    render() {

        if (!COORD_DECIMALS) {
            console.log("could not get COORD_DECIMALS from config");
            var COORD_DECIMALS = 6;
        }

        let num = parseFloat(this.props.data.data_value);

        return (num.toFixed(COORD_DECIMALS) + " " + this.props.data.data_uom);
    }

}