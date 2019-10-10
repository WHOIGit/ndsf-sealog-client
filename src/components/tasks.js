import React, { Component } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { Row, Col, Container, ListGroup } from 'react-bootstrap';
import ImportEventsModal from './import_events_modal';
import ImportAuxDataModal from './import_aux_data_modal';
import DataWipeModal from './data_wipe_modal';
import * as mapDispatchToProps from '../actions';

const importEventsDescription = (<div><h5>Import Event Records</h5><p>Add new event data records from a JSON-formated file.</p></div>);

const importAuxDataDescription = (<div><h5>Import Aux Data Records</h5><p>Add new aux data records from a JSON-formated file.</p></div>);

const dataResetDescription = (<div><h5>Wipe Local Database</h5><p>Delete all existing events from the local database.</p></div>);

class Tasks extends Component {

  constructor (props) {
    super(props);

    this.state = {
      description: "" 
    };
  }

  handleEventImport() {
    this.props.showModal('importEvents');
  }

  handleAuxDataImport() {
    this.props.showModal('importAuxData');
  }

  handleCruiseImport() {
    this.props.showModal('importCruises');
  }

  handleLoweringImport() {
    this.props.showModal('importLowerings');
  }

  handleEventTemplateImport() {
    this.props.showModal('importEventTemplates');
  }

  handleDataWipe() {
    this.props.showModal('dataWipe', { handleDelete: this.props.deleteAllEvents });
  }

  handleUserImport() {
    this.props.showModal('importUsers');
  }

  componentDidMount() {
  }

  renderTaskTable() {
    return (
      <ListGroup>
        <ListGroup.Item onMouseEnter={() => this.setState({ description: importEventsDescription })} onMouseLeave={() => this.setState({ description: "" })} onClick={ () => this.handleEventImport()}>Import Event Records</ListGroup.Item>
        <ListGroup.Item onMouseEnter={() => this.setState({ description: importAuxDataDescription })} onMouseLeave={() => this.setState({ description: "" })} onClick={ () => this.handleAuxDataImport()}>Import Aux Data Records</ListGroup.Item>
        <ListGroup.Item onMouseEnter={() => this.setState({ description: dataResetDescription })} onMouseLeave={() => this.setState({ description: "" })} onClick={ () => this.handleDataWipe()}>Wipe Local Database</ListGroup.Item>
      </ListGroup>
    );
  }

  render() {
    if (!this.props.roles) {
      return (
        <div>Loading...</div>
      );
    }

    else if(this.props.roles.includes("admin")) {
      return (
        <div>
          <ImportEventsModal />
          <ImportAuxDataModal />
          <DataWipeModal />
          <Row>
            <Col sm={5} md={{span:4, offset:1}} lg={{span:3, offset:2}}>
              {this.renderTaskTable()}
            </Col>
            <Col sm={7} md={6} lg={5}>
              <Container>
                <Row>
                  <Col>
                    {this.state.description}
                  </Col>
                </Row>
              </Container>
            </Col>
          </Row>
        </div>
      );

    } else {
      this.props.gotoHome();
    }
  }
}

function mapStateToProps(state) {

  return {
    roles: state.user.profile.roles,
  };
}

export default compose(
  connect(mapStateToProps, mapDispatchToProps),
)(Tasks);