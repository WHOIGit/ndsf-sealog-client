import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Row, Button, Col, Card, Form, FormControl, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import CruiseEditor from './cruise_editor';
import DeleteCruiseModal from './delete_cruise_modal';
import DeleteFileModal from './delete_file_modal';
import ImportCruisesModal from './import_cruises_modal';
import CopyCruiseToClipboard from './copy_cruise_to_clipboard';
import CruisePermissionsModal from './cruise_permissions_modal';
import CustomPagination from './custom_pagination';
import { USE_ACCESS_CONTROL, DEFAULT_VESSEL } from 'client_config';
import * as mapDispatchToProps from '../actions';
import { _Cruise_, _Cruises_, _cruises_ } from '../vocab';

let fileDownload = require('js-file-download');

const maxCruisesPerPage = 6;

const tableHeaderStyle = { width: (USE_ACCESS_CONTROL) ? "90px" : "70px" };

class Cruises extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1,
      filteredCruises: null,
      activeCruise: null,
    };

    this.formDidSubmit = this.formDidSubmit.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.handleCruiseImportClose = this.handleCruiseImportClose.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  componentDidMount() {
    this.props.fetchCruises();
  }


  // Helpers for determining user capabilities

  hasRole(role) {
    return (this.props.roles && this.props.roles.includes(role));
  }

  get canDelete() {
    return this.hasRole("admin");
  }

  get canHide() {
    return this.hasRole("admin");
  }

  get canEditPermissions() {
    return this.hasRole("admin");
  }

  get canManageCruises() {
    return this.hasRole("admin") || this.hasRole("cruise_manager");
  }

  get canImportCruises() {
    return this.hasRole("admin");
  }

  get canCreateCruises() {
    return this.hasRole("admin");
  }


  // Event handlers

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
  }

  handleCruiseDeleteModal(cruise) {
    this.props.showModal('deleteCruise', { cruise: cruise, handleDelete: this.props.deleteCruise });
  }

  handleCruisePermissionsModal(cruise) {
    this.props.showModal('cruisePermissions', { cruise: cruise });
    // TODO:
    // After closing the permissions modal, we should refresh the cruise list
    // so that if the modal is opened again, it will display the right content.
  }

  activateCruise(cruise) {
    this.setState({ activeCruise: cruise });
    this.props.initCruise(cruise.id);  // clears messages
    window.scrollTo(0, 0);
  }

  handleCruiseShow(cruise) {
    this.props.showCruise(cruise.id);
  }

  handleCruiseHide(cruise) {
    this.props.hideCruise(cruise.id);
  }

  handleCruiseCreate() {
    this.setState({ activeCruise: null });
    window.scrollTo(0, 0);
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
          return true;
        }
        else if (cruise.cruise_additional_meta.cruise_departure_location && cruise.cruise_additional_meta.cruise_departure_location.match(regex)) {
          return true;
        }
        else if (cruise.cruise_additional_meta.cruise_arrival_location && cruise.cruise_additional_meta.cruise_arrival_location.match(regex)) {
          return true;
        }
        else if (cruise.cruise_additional_meta.cruise_partipants && cruise.cruise_additional_meta.cruise_partipants.includes(fieldVal)) {
          return true;
        }
        return false;
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

  formDidSubmit() {
    this.setState({ activeCruise: null });
    this.props.fetchCruises();
  }


  // Rendering

  renderNewCruiseButton() {
    if(!this.canCreateCruises)
      return null;

    return (
      <Button variant="primary" size="sm" onClick={ () => this.handleCruiseCreate() } disabled={this.state.activeCruise === null}>New {_Cruise_}</Button>
    );
  }

  renderImportCruisesButton() {
    if(!this.canImportCruises)
      return null;

    return (
      <Button className="mr-1" variant="primary" size="sm" onClick={ () => this.handleCruiseImportModal()}>Import From File</Button>
    );
  }

  renderCruises() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this {_Cruise_.toLowerCase()}.</Tooltip>);
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this {_Cruise_.toLowerCase()}.</Tooltip>);
    const showTooltip = (<Tooltip id="showTooltip">{_Cruise_} is hidden, click to show.</Tooltip>);
    const hideTooltip = (<Tooltip id="hideTooltip">{_Cruise_} is visible, click to hide.</Tooltip>);
    const permissionTooltip = (<Tooltip id="permissionTooltip">User permissions.</Tooltip>);

    const cruises = (Array.isArray(this.state.filteredCruises)) ? this.state.filteredCruises : this.props.cruises;

    return cruises.map((cruise, index) => {
      if(index >= (this.state.activePage-1) * maxCruisesPerPage && index < (this.state.activePage * maxCruisesPerPage)) {
        let deleteLink = this.canDelete ? <OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon className="text-danger" onClick={ () => this.handleCruiseDeleteModal(cruise) } icon='trash' fixedWidth/></OverlayTrigger> : null;
        let hiddenLink = null;

        if(this.canHide && cruise.cruise_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={showTooltip}><FontAwesomeIcon onClick={ () => this.handleCruiseShow(cruise) } icon='eye-slash' fixedWidth/></OverlayTrigger>;
        } else if(this.canHide && !cruise.cruise_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesomeIcon className="text-success" onClick={ () => this.handleCruiseHide(cruise) } icon='eye' fixedWidth/></OverlayTrigger>;
        }

        let cruiseName = (cruise.cruise_additional_meta.cruise_name)? <span>Name: {cruise.cruise_additional_meta.cruise_name}<br/></span> : null;
        let cruiseLocation = (cruise.cruise_location)? <span>Location: {cruise.cruise_location}<br/></span> : null;
        let cruiseVessel = (DEFAULT_VESSEL !== cruise.cruise_additional_meta.cruise_vessel)? <span>Vessel: {cruise.cruise_additional_meta.cruise_vessel}<br/></span> : null;
        let cruisePi = (cruise.cruise_additional_meta.cruise_pi)? <span>PI: {cruise.cruise_additional_meta.cruise_pi}<br/></span> : null;

        const isActive = (this.state.activeCruise
            && this.state.activeCruise.id === cruise.id);

        return (
          <tr key={cruise.id}>
            <td className={ isActive ? "text-warning" : ""}>{cruise.cruise_id}</td>
            <td className={`cruise-details ${isActive ? "text-warning" : ""}`}>{cruiseName}{cruiseLocation}{cruisePi}{cruiseVessel}Dates: {moment.utc(cruise.start_ts).format('L')}<FontAwesomeIcon icon='arrow-right' fixedWidth/>{moment.utc(cruise.stop_ts).format('L')}</td>
            <td>
              <OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.activateCruise(cruise) } icon='pencil-alt' fixedWidth/></OverlayTrigger>
              {(USE_ACCESS_CONTROL && this.canEditPermissions) ? <OverlayTrigger placement="top" overlay={permissionTooltip}><FontAwesomeIcon  className="text-primary" onClick={ () => this.handleCruisePermissionsModal(cruise) } icon='user-lock' fixedWidth/></OverlayTrigger> : ''}{' '}
              {hiddenLink}{' '}
              {deleteLink}
              <CopyCruiseToClipboard cruise={cruise} />
            </td>
          </tr>
        );
      }
      return null;
    });
  }

  renderCruiseTable() {
    if(this.props.cruises && this.props.cruises.length > 0) {
      return (
        <Table responsive bordered striped size="sm">
          <thead>
            <tr>
              <th>{_Cruise_}</th>
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
        <Card.Body>No {_cruises_} found!</Card.Body>
      );
    }
  }

  renderCruiseHeader() {
    const exportTooltip = (<Tooltip id="exportTooltip">Export {_Cruises_}</Tooltip>);

    return (
      <div>
        {_Cruises_}
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
    if (!this.canManageCruises)
      return null;

    return (
      <div>
        <DeleteCruiseModal />
        <CruisePermissionsModal />
        <DeleteFileModal />
        <ImportCruisesModal handleExit={this.handleCruiseImportClose} />
        <Row>
          <Col className="px-1" sm={12} md={7} lg={6} xl={{span:5, offset:1}}>
            <Card className="border-secondary">
              <Card.Header>{this.renderCruiseHeader()}</Card.Header>
              {this.renderCruiseTable()}
            </Card>
            <CustomPagination className="mt-2" page={this.state.activePage} count={(this.state.filteredCruises)? this.state.filteredCruises.length : this.props.cruises.length} pageSelectFunc={this.handlePageSelect} maxPerPage={maxCruisesPerPage}/>
            <div className="my-2 float-right">
              {this.renderImportCruisesButton()}
              {this.renderNewCruiseButton()}
            </div>
          </Col>
          <Col className="px-1" sm={12} md={5} lg={6} xl={5}>
          <CruiseEditor
            afterFormSubmit={ this.formDidSubmit }
            cruise={ this.state.activeCruise }
          />
          </Col>
        </Row>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    cruises: state.cruise.cruises,
    roles: state.user.profile.roles
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Cruises);