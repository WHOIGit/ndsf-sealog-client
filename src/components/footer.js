import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Client } from '@hapi/nes/lib/client';
import { WS_ROOT_URL } from '../client_config';

import * as mapDispatchToProps from '../actions';

class Footer extends Component {

  constructor (props) {
    super(props);

    this.state = {
      // intervalID: null
    };

    this.handleASNAPNotification = this.handleASNAPNotification.bind(this);
    this.client = new Client(`${WS_ROOT_URL}`);
    this.connectToWS = this.connectToWS.bind(this);

  }

  componentDidMount() {
    this.handleASNAPNotification();

    if(this.props.authenticated) {
      this.connectToWS();
    }
    
    // let intervalID = setInterval(this.handleASNAPNotification, 5000);
    // this.setState({intervalID: intervalID});

  }

  componentWillUnmount() {
    if(this.props.authenticated) {
      this.client.disconnect();
    }

    // clearInterval(this.state.intervalID);
    // this.setState({intervalID: null});
  }

  async connectToWS() {

    try {
      await this.client.connect();
      // {
      //   auth: {
      //     headers: {
      //       authorization: cookies.get('token')
      //     }
      //   }
      // })

      const updateHandler = (update, flags) => {
        // console.log("update:", update);
        this.handleASNAPNotification();
      };

      this.client.subscribe('/ws/status/updateCustomVars', updateHandler);

    } catch(error) {
      console.log(error);
      throw(error);
    }
  }


  handleASNAPNotification() {
    if(this.props.authenticated) {
      this.props.fetchCustomVars();
    }

    // if(this.props.asnapStatus && this.state.intervalID) {
    //   clearInterval(this.state.intervalID);
    //   this.setState({intervalID: null});
    // }
  }

  render () {

    let asnapStatus = null;

    if(this.props.authenticated && this.props.asnapStatus === "Off") {
      asnapStatus =  (
        <span>
          ASNAP: <span className="text-danger">Off</span>
        </span>
      );
    } else if(this.props.authenticated && this.props.asnapStatus === "On") {
      asnapStatus =  (
        <span>
          ASNAP: <span className="text-success">On</span>
        </span>
      );
    } else if(this.props.authenticated) {
      asnapStatus =  (
        <span>
          ASNAP: <span className="text-warning">Unknown</span>
        </span>
      );
    }

    return (
      <div>
        <div style={{marginTop: "4px"}}>
          {asnapStatus}
          <span className="float-right">
            <a href={`/github`} target="_blank">Sealog</a> is licensed under the <a href={`/license`} target="_blank">GPLv3</a> public license
          </span>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state){

  let asnapStatus = (state.custom_var)? state.custom_var.custom_vars.find(custom_var => custom_var.custom_var_name === "asnapStatus") : null;

  return {
    asnapStatus: (asnapStatus)? asnapStatus.custom_var_value : null,
    authenticated: state.auth.authenticated,

  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Footer);
