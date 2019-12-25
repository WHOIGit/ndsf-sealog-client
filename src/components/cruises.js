import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Row, Button, Col, Card, Form, FormControl, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import CreateCruise from './create_cruise';
import UpdateCruise from './update_cruise';
import DeleteCruiseModal from './delete_cruise_modal';
import ImportCruisesModal from './import_cruises_modal';
import CruisePermissionsModal from './cruise_permissions_modal';
import CustomPagination from './custom_pagination';
import { USE_ACCESS_CONTROL, DEFAULT_VESSEL } from '../client_config';
import * as mapDispatchToProps from '../actions';

let fileDownload = require('js-file-download');

const maxCruisesPerPage = 6;

const tableHeaderStyle = { width: (USE_ACCESS_CONTROL) ? "100px" : "85px" };

class Cruises extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1,
      filteredCruises: null
    };

    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.handleCruiseImportClose = this.handleCruiseImportClose.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  componentDidMount() {
    this.props.fetchCruises();
  }

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
  }

  handleCruiseDeleteModal(id) {
    this.props.showModal('deleteCruise', { id: id, handleDelete: this.props.deleteCruise });
  }

  handleCruisePermissions(cruise) {
    this.props.showModal('cruisePermissions', { cruise_id: cruise.id });
  }

  handleCruiseUpdate(id) {
    this.props.initCruise(id);
    window.scrollTo(0, 0);
  }

  handleCruiseShow(id) {
    this.props.showCruise(id);
  }

  handleCruiseHide(id) {
    this.props.hideCruise(id);
  }

  handleCruiseCreate() {
    this.props.leaveUpdateCruiseForm();
  }

  handleCruiseImportModal() {
    this.props.showModal('importCruises', { handleHide: this.handleCruiseImportClose });
  }

  handleCruiseImportClose() {
    this.props.fetchCruises();
  }

  handleSearchChange(event) {
    let fieldVal = event.target.value;
    if(fieldVal !== "") {
      this.setState({filteredCruises: this.props.cruises.filter((cruise) => {
        const regex = RegExp(fieldVal, 'i');
        if(cruise.cruise_id.match(regex) || cruise.cruise_location.match(regex) || cruise.cruise_tags.includes(fieldVal) || cruise.cruise_additional_meta.cruise_vessel.match(regex)  || cruise.cruise_additional_meta.cruise_pi.match(regex)) {
          return cruise;
        }
        else if (cruise.cruise_additional_meta.cruise_departure_location && cruise.cruise_additional_meta.cruise_departure_location.match(regex)) {
          return cruise;
        }
        else if (cruise.cruise_additional_meta.cruise_arrival_location && cruise.cruise_additional_meta.cruise_arrival_location.match(regex)) {
          return cruise;
        }
        else if (cruise.cruise_additional_meta.cruise_partipants && cruise.cruise_additional_meta.cruise_partipants.includes(fieldVal)) {
          return cruise;
        }
      })
      });
    }
    else {
      this.setState({filteredCruises: null});
    }
    this.handlePageSelect(1);
  }


  exportCruisesToJSON() {
    fileDownload(JSON.stringify(this.props.cruises, null, "\t"), 'sealog_cruisesExport.json');
  }

  renderAddCruiseButton() {
    if (!this.props.showform && this.props.roles && this.props.roles.includes('admin')) {
      return (
        <div className="float-right">
          <Button variant="primary" size="sm" onClick={ () => this.handleCruiseCreate()} disabled={!this.props.cruiseid}>Add Cruise</Button>
        </div>
      );
    }
  }

  renderImportCruisesButton() {
    if(this.props.roles.includes("admin")) {
      return (
        <div className="float-right">
          <Button variant="primary" size="sm" onClick={ () => this.handleCruiseImportModal()}>Import From File</Button>
        </div>
      );
    }
  }

  renderCruises() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this cruise.</Tooltip>);
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this cruise.</Tooltip>);
    const showTooltip = (<Tooltip id="showTooltip">Cruise is hidden, click to show.</Tooltip>);
    const hideTooltip = (<Tooltip id="hideTooltip">Cruise is visible, click to hide.</Tooltip>);
    const permissionTooltip = (<Tooltip id="permissionTooltip">User permissions.</Tooltip>);

    const cruises = (Array.isArray(this.state.filteredCruises)) ? this.state.filteredCruises : this.props.cruises;

    return cruises.map((cruise, index) => {
      if(index >= (this.state.activePage-1) * maxCruisesPerPage && index < (this.state.activePage * maxCruisesPerPage)) {
        let deleteLink = (this.props.roles.includes('admin'))? <OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon className="text-danger" onClick={ () => this.handleCruiseDeleteModal(cruise.id) } icon='trash' fixedWidth/></OverlayTrigger>: null;
        let hiddenLink = null;

        if(this.props.roles.includes('admin') && cruise.cruise_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={showTooltip}><FontAwesomeIcon onClick={ () => this.handleCruiseShow(cruise.id) } icon='eye-slash' fixedWidth/></OverlayTrigger>;
        } else if(this.props.roles.includes('admin') && !cruise.cruise_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesomeIcon className="text-success" onClick={ () => this.handleCruiseHide(cruise.id) } icon='eye' fixedWidth/></OverlayTrigger>;
        }

        let cruiseName = (cruise.cruise_additional_meta.cruise_name)? <span>Name: {cruise.cruise_additional_meta.cruise_name}<br/></span> : null;
        let cruiseLocation = (cruise.cruise_location)? <span>Location: {cruise.cruise_location}<br/></span> : null;
        let cruiseVessel = (DEFAULT_VESSEL !== cruise.cruise_additional_meta.cruise_vessel)? <span>Vessel: {cruise.cruise_additional_meta.cruise_vessel}<br/></span> : null;
        let cruisePi = (cruise.cruise_additional_meta.cruise_pi)? <span>PI: {cruise.cruise_additional_meta.cruise_pi}<br/></span> : null;

        return (
          <tr key={cruise.id}>
            <td className={(this.props.cruiseid === cruise.id)? "text-warning" : ""}>{cruise.cruise_id}</td>
            <td>{cruiseName}{cruiseLocation}{cruisePi}{cruiseVessel}Dates: {moment.utc(cruise.start_ts).format('L')}<FontAwesomeIcon icon='arrow-right' fixedWidth/>{moment.utc(cruise.stop_ts).format('L')}</td>
            <td>
              <OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleCruiseUpdate(cruise.id) } icon='pencil-alt' fixedWidth/></OverlayTrigger>
              {(USE_ACCESS_CONTROL && this.props.roles.includes('admin')) ? <OverlayTrigger placement="top" overlay={permissionTooltip}><FontAwesomeIcon  className="text-primary" onClick={ () => this.handleCruisePermissions(cruise) } icon='user-lock' fixedWidth/></OverlayTrigger> : ''}{' '}
              {hiddenLink}
              {deleteLink}
            </td>
          </tr>
        );
      }
    });
  }

  renderCruiseTable() {
    if(this.props.cruises && this.props.cruises.length > 0) {
      return (
        <Table responsive bordered striped>
          <thead>
            <tr>
              <th>Cruise</th>
              <th>Details</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.renderCruises()}
          </tbody>
        </Table>
      );
    } else {
      return (
        <Card.Body>No Cruises found!</Card.Body>
      );
    }
  }

  renderCruiseHeader() {

    const Label = "Cruises";
    const exportTooltip = (<Tooltip id="exportTooltip">Export Cruises</Tooltip>);

    return (
      <div>
        { Label }
        <span className="float-right">
          <Form inline>
            <FormControl size="sm" type="text" placeholder="Search" className="mr-sm-2" onChange={this.handleSearchChange}/>
            <OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon onClick={ () => this.exportCruisesToJSON() } icon='download' fixedWidth/></OverlayTrigger>
          </Form>
        </span>
      </div>
    );
  }

  render() {
    if (!this.props.roles) {
      return (
        <div>Loading...</div>
      );
    }

    if(this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager')) {

      let cruiseForm = null;
  
      if(this.props.cruiseid) {
        cruiseForm = <UpdateCruise handleFormSubmit={ this.props.fetchCruises } />;
      } else {
        cruiseForm = <CreateCruise handleFormSubmit={ this.props.fetchCruises } />;
      }

      return (
        <div>
          <DeleteCruiseModal />
          <CruisePermissionsModal />
          <ImportCruisesModal  handleExit={this.handleCruiseImportClose} />
          <Row>
            <Col sm={12} md={7} lg={6} xl={{span:5, offset:1}}>
              <Card>
                <Card.Header>{this.renderCruiseHeader()}</Card.Header>
                {this.renderCruiseTable()}
              </Card>
              <CustomPagination style={{marginTop: "8px"}} page={this.state.activePage} count={(this.state.filteredCruises)? this.state.filteredCruises.length : this.props.cruises.length} pageSelectFunc={this.handlePageSelect} maxPerPage={maxCruisesPerPage}/>
              <div style={{marginTop: "8px", marginRight: "-8px"}}>
                {this.renderAddCruiseButton()}
                {this.renderImportCruisesButton()}
              </div>
            </Col>
            <Col sm={12} md={5} lg={6} xl={5}>
              { cruiseForm }
            </Col>
          </Row>
        </div>
      );
    } else {
      return (
        <div>
          What are YOU doing here?
        </div>
      );
    }
  }
}

function mapStateToProps(state) {
  return {
    cruises: state.cruise.cruises,
    cruiseid: state.cruise.cruise.id,
    roles: state.user.profile.roles
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Cruises);