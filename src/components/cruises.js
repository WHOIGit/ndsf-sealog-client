import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Row, Button, Col, Card, Form, FormControl, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import CreateCruise from './create_cruise';
import UpdateCruise from './update_cruise';
import DeleteCruiseModal from './delete_cruise_modal';
import DeleteFileModal from './delete_file_modal';
import ImportCruisesModal from './import_cruises_modal';
import CopyCruiseToClipboard from './copy_cruise_to_clipboard';
import CruisePermissionsModal from './cruise_permissions_modal';
import CustomPagination from './custom_pagination';
import StatsForROVTeamModal from './stats_for_rov_team_modal';
import { USE_ACCESS_CONTROL, DEFAULT_VESSEL, CUSTOM_CRUISE_NAME } from '../client_config';
import * as mapDispatchToProps from '../actions';

let fileDownload = require('js-file-download');

const maxCruisesPerPage = 6;

const tableHeaderStyle = { width: (USE_ACCESS_CONTROL) ? "90px" : "70px" };

class Cruises extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1,
      filteredCruises: null,
      cruise_name: (CUSTOM_CRUISE_NAME)? CUSTOM_CRUISE_NAME[0].charAt(0).toUpperCase() + CUSTOM_CRUISE_NAME[0].slice(1) : "Cruise",
      cruises_name: (CUSTOM_CRUISE_NAME)? CUSTOM_CRUISE_NAME[1].charAt(0).toUpperCase() + CUSTOM_CRUISE_NAME[1].slice(1) : "Cruises",
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

  handleCruisePermissionsModal(cruise) {
    this.props.showModal('cruisePermissions', { cruise_id: cruise.id });
  }

  handleStatsForROVTeamModal(cruise) {
    this.props.showModal('statsForROVTeam', { cruise: cruise });
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
        <Button variant="primary" size="sm" onClick={ () => this.handleCruiseCreate()} disabled={!this.props.cruiseid}>Add {this.state.cruise_name}</Button>
      );
    }
  }

  renderImportCruisesButton() {
    if(this.props.roles.includes("admin")) {
      return (
        <Button className="mr-1" variant="primary" size="sm" onClick={ () => this.handleCruiseImportModal()}>Import From File</Button>
      );
    }
  }

  renderCruises() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this {this.state.cruise_name.toLowerCase()}.</Tooltip>);
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this {this.state.cruise_name.toLowerCase()}.</Tooltip>);
    const showStatsForROVTeamTooltip = (<Tooltip id="showTooltip">Show {this.state.cruise_name.toLowerCase()} stats.</Tooltip>);    
    const showTooltip = (<Tooltip id="showTooltip">{this.state.cruise_name} is hidden, click to show.</Tooltip>);
    const hideTooltip = (<Tooltip id="hideTooltip">{this.state.cruise_name} is visible, click to hide.</Tooltip>);
    const permissionTooltip = (<Tooltip id="permissionTooltip">User permissions.</Tooltip>);

    const cruises = (Array.isArray(this.state.filteredCruises)) ? this.state.filteredCruises : this.props.cruises;

    return cruises.map((cruise, index) => {
      if(index >= (this.state.activePage-1) * maxCruisesPerPage && index < (this.state.activePage * maxCruisesPerPage)) {
        let statsForROVTeamLink = <OverlayTrigger placement="top" overlay={showStatsForROVTeamTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleStatsForROVTeamModal(cruise) } icon='table' fixedWidth/></OverlayTrigger>;
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
            <td className={`cruise-details ${(this.props.cruiseid === cruise.id)? "text-warning" : ""}`}>{cruiseName}{cruiseLocation}{cruisePi}{cruiseVessel}Dates: {moment.utc(cruise.start_ts).format('L')}<FontAwesomeIcon icon='arrow-right' fixedWidth/>{moment.utc(cruise.stop_ts).format('L')}</td>
            <td>
              <OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleCruiseUpdate(cruise.id) } icon='pencil-alt' fixedWidth/></OverlayTrigger>
              {(USE_ACCESS_CONTROL && this.props.roles.includes('admin')) ? <OverlayTrigger placement="top" overlay={permissionTooltip}><FontAwesomeIcon  className="text-primary" onClick={ () => this.handleCruisePermissionsModal(cruise) } icon='user-lock' fixedWidth/></OverlayTrigger> : ''}{' '}
              {hiddenLink}{' '}
              {statsForROVTeamLink}{' '}
              {deleteLink}
              <CopyCruiseToClipboard cruise={cruise} />
            </td>
          </tr>
        );
      }
    });
  }

  renderCruiseTable() {
    if(this.props.cruises && this.props.cruises.length > 0) {
      return (
        <Table responsive bordered striped size="sm">
          <thead>
            <tr>
              <th>{this.state.cruise_name}</th>
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
        <Card.Body>No {this.state.cruises_name} found!</Card.Body>
      );
    }
  }

  renderCruiseHeader() {

    const exportTooltip = (<Tooltip id="exportTooltip">Export {this.state.cruises_name}</Tooltip>);

    return (
      <div>
        {this.state.cruises_name}
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
          <DeleteFileModal />
          <CruisePermissionsModal />
          <StatsForROVTeamModal />
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
                {this.renderAddCruiseButton()}
              </div>
            </Col>
            <Col className="px-1" sm={12} md={5} lg={6} xl={5}>
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