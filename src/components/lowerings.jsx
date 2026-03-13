import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Row, Button, Col, Card, Form, FormControl, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import LoweringEditor from './lowering_editor';
import DeleteFileModal from './delete_file_modal';
import DeleteLoweringModal from './delete_lowering_modal';
import ImportLoweringsModal from './import_lowerings_modal';
import CopyLoweringToClipboard from './copy_lowering_to_clipboard';
import SetLoweringStatsModal from './set_lowering_stats_modal';
import LoweringPermissionsModal from './lowering_permissions_modal';
import CustomPagination from './custom_pagination';
import { USE_ACCESS_CONTROL } from 'client_config';
import * as mapDispatchToProps from '../actions';
import { _Lowering_, _Lowerings_, _lowering_, _lowerings_ } from '../vocab';

let fileDownload = require('js-file-download');

const maxLoweringsPerPage = 8;

const tableHeaderStyle = { width: (USE_ACCESS_CONTROL) ? "90px" : "80px" };

class Lowerings extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1,
      filteredLowerings: null,
      activeLowering: null,
    };

    this.formDidSubmit = this.formDidSubmit.bind(this);
    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.handleLoweringImportClose = this.handleLoweringImportClose.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);
  }

  componentDidMount() {
    this.props.fetchLowerings();
  }


  // Helpers for determining user capabilities

  hasRole(role) {
    return this.props.roles.includes(role);
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

  get canManageLowerings() {
    return this.hasRole("admin") || this.hasRole("cruise_manager");
  }

  get canImportLowerings() {
    return this.hasRole("admin");
  }

  get canCreateLowerings() {
    return this.hasRole("admin");
  }


  // Event handlers

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
  }

  handleLoweringDeleteModal(lowering) {
    this.props.showModal('deleteLowering', { lowering: lowering, handleDelete: this.props.deleteLowering });
  }

  activateLowering(lowering) {
    this.setState({ activeLowering: lowering });
    this.props.initLowering(lowering.id);  // clears messages
    window.scrollTo(0, 0);
  }

  handleLoweringShow(lowering) {
    this.props.showLowering(lowering.id);
  }

  handleLoweringHide(lowering) {
    this.props.hideLowering(lowering.id);
  }

  handleLoweringCreate() {
    this.setState({ activeLowering: null });
    window.scrollTo(0, 0);
  }

  handleLoweringImportModal() {
    this.props.showModal('importLowerings', { handleHide: this.handleLoweringImportClose });
  }

  handleLoweringPermissions(lowering) {
    this.props.showModal('loweringPermissions', { lowering: lowering });
  }

  handleLoweringImportClose() {
    this.props.fetchLowerings();
  }

  handleSearchChange(event) {
    let fieldVal = event.target.value;
    if(fieldVal !== "") {
      this.setState({filteredLowerings: this.props.lowerings.filter((lowering) => {
        const regex = RegExp(fieldVal, 'i');
        if(lowering.lowering_id.match(regex) || lowering.lowering_location.match(regex)) {
          return true;
        }
        else if (lowering.lowering_tags.includes(fieldVal)){
          return true; 
        }
        return false;
      })
      });
    }
    else {
      this.setState({filteredLowerings: null});
    }
    this.handlePageSelect(1);
  }

  exportLoweringsToJSON() {
    fileDownload(JSON.stringify(this.props.lowerings, null, 2), 'sealog_loweringExport.json');
  }

  formDidSubmit() {
    this.setState({ activeLowering: null });
    this.props.fetchLowerings();
  }


  // Rendering

  renderNewLoweringButton() {
    if(!this.canCreateLowerings)
      return null;

    return (
      <Button variant="primary" size="sm" onClick={ () => this.handleLoweringCreate()} disabled={this.state.activeLowering === null}>New {_Lowering_}</Button>
    );
  }

  renderImportLoweringsButton() {
    if(!this.canImportLowerings)
      return null;

    return (
      <Button className="mr-1" variant="primary" size="sm" onClick={ () => this.handleLoweringImportModal()}>Import From File</Button>
    );
  }

  renderLowerings() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this {_lowering_}.</Tooltip>);
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this {_lowering_}.</Tooltip>);
    const showTooltip = (<Tooltip id="showTooltip">{_Lowering_} is hidden, click to show.</Tooltip>);
    const hideTooltip = (<Tooltip id="hideTooltip">{_Lowering_} is visible, click to hide.</Tooltip>);
    const permissionTooltip = (<Tooltip id="permissionTooltip">User permissions.</Tooltip>);

    const lowerings = (Array.isArray(this.state.filteredLowerings)) ? this.state.filteredLowerings : this.props.lowerings;

    return lowerings.map((lowering, index) => {
      if(index >= (this.state.activePage-1) * maxLoweringsPerPage && index < (this.state.activePage * maxLoweringsPerPage)) {
        let deleteLink = this.canDelete ? <OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon className="text-danger" onClick={ () => this.handleLoweringDeleteModal(lowering) } icon='trash' fixedWidth/></OverlayTrigger>: null;
        let hiddenLink = null;

        if(this.canHide && lowering.lowering_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={showTooltip}><FontAwesomeIcon onClick={ () => this.handleLoweringShow(lowering) } icon='eye-slash' fixedWidth/></OverlayTrigger>;
        } else if(this.canHide && !lowering.lowering_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesomeIcon className="text-success" onClick={ () => this.handleLoweringHide(lowering) } icon='eye' fixedWidth/></OverlayTrigger>;  
        }

        let loweringLocation = (lowering.lowering_location)? <span>Location: {lowering.lowering_location}<br/></span> : null;
        let loweringStartTime = moment.utc(lowering.start_ts);
        let loweringEndTime = moment.utc(lowering.stop_ts);
        let loweringStarted = <span>Started: {loweringStartTime.format("YYYY-MM-DD HH:mm")}<br/></span>;
        let loweringDuration = loweringEndTime.diff(loweringStartTime);

        let loweringDurationStr = <span>Duration: {moment.duration(loweringDuration).format("d [days] h [hours] m [minutes]")}<br/></span>;

        const isActive = (this.state.activeLowering
          && this.state.activeLowering.id === lowering.id);

        return (
          <tr key={lowering.id}>
            <td className={isActive ? "text-warning" : ""}>{lowering.lowering_id}</td>
            <td className={`lowering-details ${isActive ? "text-warning" : ""}`}>{loweringLocation}{loweringStarted}{loweringDurationStr}</td>
            <td>
              <OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.activateLowering(lowering) } icon='pencil-alt' fixedWidth/></OverlayTrigger>
              {(USE_ACCESS_CONTROL && this.canEditPermissions) ? <OverlayTrigger placement="top" overlay={permissionTooltip}><FontAwesomeIcon  className="text-primary" onClick={ () => this.handleLoweringPermissions(lowering) } icon='user-lock' fixedWidth/></OverlayTrigger> : ''}{' '}
              {hiddenLink}{' '}
              {deleteLink}
              <CopyLoweringToClipboard lowering={lowering} />
            </td>
          </tr>
        );
      }
      return null;
    });      
  }

  renderLoweringTable() {
    if(this.props.lowerings && this.props.lowerings.length > 0){
      return (
        <Table responsive bordered striped size="sm">
          <thead>
            <tr>
              <th>{_Lowering_}</th>
              <th>Details</th>
              <th style={tableHeaderStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.renderLowerings()}
          </tbody>
        </Table>
      );
    } else {
      return (
        <Card.Body>No {_lowerings_} found!</Card.Body>
      );
    }
  }

  renderLoweringHeader() {

    const exportTooltip = (<Tooltip id="exportTooltip">Export {_Lowerings_}</Tooltip>);

    return (
      <div>
        {_Lowerings_}
        <span className="float-right">
          <Form inline>
            <FormControl size="sm" type="text" placeholder="Search" className="mr-sm-2" onChange={this.handleSearchChange}/>
            <OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon onClick={ () => this.exportLoweringsToJSON() } icon='download' fixedWidth/></OverlayTrigger>
          </Form>
        </span>
      </div>
    );
  }

  render() {
    if (!this.canManageLowerings)
      return null;

    return (
      <div>
        <DeleteFileModal />
        <DeleteLoweringModal />
        <ImportLoweringsModal handleExit={this.handleLoweringImportClose} />
        <SetLoweringStatsModal />
        <LoweringPermissionsModal />
        <Row>
          <Col className="px-1" sm={12} md={7} lg={6} xl={{span:5, offset:1}}>
            <Card className="border-secondary">
              <Card.Header>{this.renderLoweringHeader()}</Card.Header>
              {this.renderLoweringTable()}
            </Card>
            <CustomPagination className="mt-2" page={this.state.activePage} count={(this.state.filteredLowerings)? this.state.filteredLowerings.length : this.props.lowerings.length} pageSelectFunc={this.handlePageSelect} maxPerPage={maxLoweringsPerPage}/>
            <div className="float-right my-2">
              {this.renderImportLoweringsButton()}
              {this.renderNewLoweringButton()}
            </div>
          </Col>
          <Col className="px-1" sm={12} md={5} lg={6} xl={5}>
            <LoweringEditor
              lowering={ this.state.activeLowering }
              afterFormSubmit={ this.formDidSubmit }
            />
          </Col>
        </Row>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    lowerings: state.lowering.lowerings,
    roles: state.user.profile.roles
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Lowerings);