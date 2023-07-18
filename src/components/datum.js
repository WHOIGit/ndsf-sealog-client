import React, { Component } from 'react';
import { DATA_DECIMALS } from 'client_config';

export default class Datum extends Component {

    constructor (props) {
        super(props);
    }

    render() {

        if (!DATA_DECIMALS) {
            console.log("could not get DATA_DECIMALS from config");
            var DATA_DECIMALS = 2;
        }

        let str = this.props.data.data_value;
        let float = parseFloat(str).toFixed(DATA_DECIMALS);

        if(float != 'NaN') {
            // the datum is a number
            str = float;
        }
        else {
            // the datum is not a number
        }

        if (str.slice(-1) == '0') {
            str = str.substring(0, str.length-1);
        }

        return (str + " " + this.props.data.data_uom);
    }

}