import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Row, Button, Col, Card, Form, FormControl, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import CreateLowering from './create_lowering';
import UpdateLowering from './update_lowering';
import DeleteFileModal from './delete_file_modal';
import DeleteLoweringModal from './delete_lowering_modal';
import ImportLoweringsModal from './import_lowerings_modal';
import CopyLoweringToClipboard from './copy_lowering_to_clipboard';
import SetLoweringStatsModal from './set_lowering_stats_modal';
import LoweringPermissionsModal from './lowering_permissions_modal';
import SVProfileModal from './sv_profile_modal';
import CustomPagination from './custom_pagination';
import { USE_ACCESS_CONTROL, CUSTOM_LOWERING_NAME } from '../client_config';
import * as mapDispatchToProps from '../actions';

let fileDownload = require('js-file-download');

const maxLoweringsPerPage = 8;

const tableHeaderStyle = { width: (USE_ACCESS_CONTROL) ? "90px" : "80px" };

class Lowerings extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activePage: 1,
      filteredLowerings: null,
      lowering_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[0].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[0].slice(1) : "Lowering",
      lowerings_name: (CUSTOM_LOWERING_NAME)? CUSTOM_LOWERING_NAME[1].charAt(0).toUpperCase() + CUSTOM_LOWERING_NAME[1].slice(1) : "Lowerings"
    };

    this.handlePageSelect = this.handlePageSelect.bind(this);
    this.handleLoweringImportClose = this.handleLoweringImportClose.bind(this);
    this.handleSearchChange = this.handleSearchChange.bind(this);

  }

  componentDidMount() {
    this.props.fetchLowerings();
  }

  handlePageSelect(eventKey) {
    this.setState({activePage: eventKey});
  }

  handleLoweringDeleteModal(id) {
    this.props.showModal('deleteLowering', { id: id, handleDelete: this.props.deleteLowering });
  }

  handleLoweringUpdate(id) {
    this.props.initLowering(id);
    window.scrollTo(0, 0);
  }

  handleLoweringShow(id) {
    this.props.showLowering(id);
  }

  handleLoweringHide(id) {
    this.props.hideLowering(id);
  }

  handleLoweringCreate() {
    this.props.leaveUpdateLoweringForm();
  }

  handleLoweringImportModal() {
    this.props.showModal('importLowerings', { handleHide: this.handleLoweringImportClose });
  }

  handleSVProfileModal(lowering) {
    this.props.showModal('svProfile', { lowering: lowering });
  }

  handleLoweringPermissions(lowering_id) {
    this.props.showModal('loweringPermissions', { lowering_id: lowering_id });
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
          return lowering;
        }
        else if (lowering.lowering_tags.includes(fieldVal)){
          return lowering; 
        }
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

  renderAddLoweringButton() {
    if (!this.props.showform && this.props.roles && this.props.roles.includes('admin')) {
      return (
        <Button variant="primary" size="sm" onClick={ () => this.handleLoweringCreate()} disabled={!this.props.loweringid}>Add {this.state.lowering_name}</Button>
      );
    }
  }

  renderImportLoweringsButton() {
    if(this.props.roles.includes("admin")) {
      return (
        <Button className="mr-1" variant="primary" size="sm" onClick={ () => this.handleLoweringImportModal()}>Import From File</Button>
      );
    }
  }

  renderLowerings() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this {this.state.lowering_name.toLowerCase()}.</Tooltip>);
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this {this.state.lowering_name.toLowerCase()}.</Tooltip>);
    const showSVProfile = (<Tooltip id="showTooltip">Show Downcast SV Profile.</Tooltip>);
    const showTooltip = (<Tooltip id="showTooltip">{this.state.lowering_name} is hidden, click to show.</Tooltip>);
    const hideTooltip = (<Tooltip id="hideTooltip">{this.state.lowering_name} is visible, click to hide.</Tooltip>);
    const permissionTooltip = (<Tooltip id="permissionTooltip">User permissions.</Tooltip>);

    const lowerings = (Array.isArray(this.state.filteredLowerings)) ? this.state.filteredLowerings : this.props.lowerings;

    return lowerings.map((lowering, index) => {
      if(index >= (this.state.activePage-1) * maxLoweringsPerPage && index < (this.state.activePage * maxLoweringsPerPage)) {
        let svProfileLink = <OverlayTrigger placement="top" overlay={showSVProfile}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleSVProfileModal(lowering) } icon='table' fixedWidth/></OverlayTrigger>;
        let deleteLink = (this.props.roles.includes('admin'))? <OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon className="text-danger" onClick={ () => this.handleLoweringDeleteModal(lowering.id) } icon='trash' fixedWidth/></OverlayTrigger>: null;
        let hiddenLink = null;

        if(this.props.roles.includes('admin') && lowering.lowering_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={showTooltip}><FontAwesomeIcon onClick={ () => this.handleLoweringShow(lowering.id) } icon='eye-slash' fixedWidth/></OverlayTrigger>;
        } else if(this.props.roles.includes('admin') && !lowering.lowering_hidden) {
          hiddenLink = <OverlayTrigger placement="top" overlay={hideTooltip}><FontAwesomeIcon className="text-success" onClick={ () => this.handleLoweringHide(lowering.id) } icon='eye' fixedWidth/></OverlayTrigger>;  
        }

        let loweringLocation = (lowering.lowering_location)? <span>Location: {lowering.lowering_location}<br/></span> : null;
        let loweringStartTime = moment.utc(lowering.start_ts);
        let loweringEndTime = moment.utc(lowering.stop_ts);
        let loweringStarted = <span>Started: {loweringStartTime.format("YYYY-MM-DD HH:mm")}<br/></span>;
        let loweringDuration = loweringEndTime.diff(loweringStartTime);

        let loweringDurationStr = <span>Duration: {moment.duration(loweringDuration).format("d [days] h [hours] m [minutes]")}<br/></span>;

        return (
          <tr key={lowering.id}>
            <td className={(this.props.loweringid === lowering.id)? "text-warning" : ""}>{lowering.lowering_id}</td>
            <td className={`lowering-details ${(this.props.loweringid === lowering.id)? "text-warning" : ""}`}>{loweringLocation}{loweringStarted}{loweringDurationStr}</td>
            <td>
              <OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleLoweringUpdate(lowering.id) } icon='pencil-alt' fixedWidth/></OverlayTrigger>
              {(USE_ACCESS_CONTROL && this.props.roles.includes('admin')) ? <OverlayTrigger placement="top" overlay={permissionTooltip}><FontAwesomeIcon  className="text-primary" onClick={ () => this.handleLoweringPermissions(lowering.id) } icon='user-lock' fixedWidth/></OverlayTrigger> : ''}{' '}
              {hiddenLink}{' '}
              {svProfileLink}{' '}
              {deleteLink}
              <CopyLoweringToClipboard lowering={lowering} />
            </td>
          </tr>
        );
      }
    });      
  }

  renderLoweringTable() {
    if(this.props.lowerings && this.props.lowerings.length > 0){
      return (
        <Table responsive bordered striped size="sm">
          <thead>
            <tr>
              <th>{this.state.lowering_name}</th>
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
        <Card.Body>No {this.state.lowerings_name} Found!</Card.Body>
      );
    }
  }

  renderLoweringHeader() {

    const exportTooltip = (<Tooltip id="exportTooltip">Export {this.state.lowerings_name}</Tooltip>);

    return (
      <div>
        {this.state.lowerings_name}
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
    if (!this.props.roles) {
      return (
        <div>Loading...</div>
      );
    }

    if(this.props.roles.includes("admin") || this.props.roles.includes('cruise_manager')) {

      let loweringForm = (this.props.loweringid) ? <UpdateLowering handleFormSubmit={ this.props.fetchLowerings } /> : <CreateLowering handleFormSubmit={ this.props.fetchLowerings } />;

      return (
        <div>
          <DeleteFileModal />
          <DeleteLoweringModal />
          <ImportLoweringsModal handleExit={this.handleLoweringImportClose} />
          <SetLoweringStatsModal />
          <SVProfileModal />
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
                {this.renderAddLoweringButton()}
              </div>
            </Col>
            <Col className="px-1" sm={12} md={5} lg={6} xl={5}>
              { loweringForm }
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
    lowerings: state.lowering.lowerings,
    loweringid: state.lowering.lowering.id,
    roles: state.user.profile.roles
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Lowerings);