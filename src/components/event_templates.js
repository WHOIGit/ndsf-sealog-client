import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { connect } from 'react-redux';
import { Row, Button, Col, Card, Table, OverlayTrigger, Tooltip } from 'react-bootstrap';
import CreateEventTemplate from './create_event_template';
import UpdateEventTemplate from './update_event_template';
import NonSystemEventTemplatesWipeModal from './non_system_event_templates_wipe_modal';
import DeleteEventTemplateModal from './delete_event_template_modal';
import ImportEventTemplatesModal from './import_event_templates_modal';
import EventTemplateOptionsModal from './event_template_options_modal';
import * as mapDispatchToProps from '../actions';

let fileDownload = require('js-file-download');

class EventTemplates extends Component {

  constructor (props) {

    super(props);

    this.handleEventTemplateImportClose = this.handleEventTemplateImportClose.bind(this);
  }

  componentDidMount() {

    this.props.fetchEventTemplates();
  }

  handleEventTemplateDelete(id) {

    this.props.showModal('deleteEventTemplate', { id: id, handleDelete: this.props.deleteEventTemplate });
  }

  handleEventTemplateSelect(id) {

    this.props.leaveUpdateEventTemplateForm();
    this.props.initEventTemplate(id);
  }

  handleEventTemplateCreate() {

    this.props.leaveUpdateEventTemplateForm();
  }

  handleEventTemplateImport() {

    this.props.showModal('importEventTemplates');
  }

  handleEventTemplateImportClose() {

    this.props.fetchEventTemplates();
  }

  handleNonSystemEventTemplatesWipe() {

    this.props.showModal('nonSystemEventTemplatesWipe', { handleDelete: this.props.deleteAllNonSystemEventTemplates });
  }

  handleEventTemplateTest(event_template) {

    this.props.showModal('eventOptions', { eventTemplate: event_template, event: null, handleUpdateEvent: null, handleDeleteEvent: null });
  }

  exportTemplatesToJSON() {

    fileDownload(JSON.stringify(this.props.event_templates.filter(template => template.system_template === false), null, 2), 'sealog_eventTemplateExport.json');
  }

  exportSystemTemplatesToJSON() {

    fileDownload(JSON.stringify(this.props.event_templates.filter(template => template.system_template === true), null, 2), 'sealog_systemEventTemplateExport.json');
  }

  renderAddEventTemplateButton() {

    if (!this.props.showform && this.props.roles && (this.props.roles.includes('admin') || this.props.roles.includes('event_manager'))) {
      return (
        <Button variant="primary" size="sm" disabled={!this.props.event_templateid} onClick={ () => this.handleEventTemplateCreate()}>Add Event Template</Button>
      );
    }
  }

  renderImportEventTemplatesButton() {

    if(this.props.roles.includes("admin")) {
      return (
        <Button variant="primary" size="sm" onClick={ () => this.handleEventTemplateImport()}>Import From File</Button>
      );
    }
  }


  renderEventTemplates() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this template.</Tooltip>);
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this template.</Tooltip>);
    const testTooltip = (<Tooltip id="testTooltip">Test this template.</Tooltip>);

    return this.props.event_templates.filter(template => template.system_template === false).map((template) => {

      const style = (template.disabled)? {"textDecoration": "line-through"}: {};

      return (
        <tr key={template.id}>
          <td style={style} className={(this.props.event_templateid === template.id)? "text-warning" : ""}>{template.event_name}</td>
          <td style={style}>{template.event_value}</td>
          <td>
            <OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleEventTemplateSelect(template.id) } icon='pencil-alt' fixedWidth/></OverlayTrigger>{' '}
            <OverlayTrigger placement="top" overlay={testTooltip}><FontAwesomeIcon className="text-success" onClick={ () => this.handleEventTemplateTest(template) } icon='vial' fixedWidth/></OverlayTrigger>{' '}
            <OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon className="text-danger" onClick={ () => this.handleEventTemplateDelete(template.id) } icon='trash' fixedWidth/></OverlayTrigger>
          </td>
        </tr>
      );
    });
  }

  renderSystemEventTemplates() {

    const editTooltip = (<Tooltip id="editTooltip">Edit this template.</Tooltip>);
    const deleteTooltip = (<Tooltip id="deleteTooltip">Delete this template.</Tooltip>);
    const testTooltip = (<Tooltip id="testTooltip">Test this template.</Tooltip>);

    if(this.props.event_templates && this.props.event_templates.length > 0) {

      const systemTemplates = this.props.event_templates.filter(template => template.system_template === true);
      return systemTemplates.map((template) => {

        const edit_icon = (this.props.roles.includes("admin"))? (<OverlayTrigger placement="top" overlay={editTooltip}><FontAwesomeIcon className="text-primary" onClick={ () => this.handleEventTemplateSelect(template.id) } icon='pencil-alt' fixedWidth/></OverlayTrigger>): null;
        const test_icon = <OverlayTrigger placement="top" overlay={testTooltip}><FontAwesomeIcon className="text-success" onClick={ () => this.handleEventTemplateTest(template) } icon='vial' fixedWidth/></OverlayTrigger>;
        const delete_icon = (this.props.roles.includes("admin"))? (<OverlayTrigger placement="top" overlay={deleteTooltip}><FontAwesomeIcon className="text-danger" onClick={ () => this.handleEventTemplateDelete(template.id) } icon='trash' fixedWidth/></OverlayTrigger>): null;

        const style = (template.disabled)? {"textDecoration": "line-through"}: {};
    
        return (
          <tr key={template.id}>
            <td style={style} className={(this.props.event_templateid === template.id)? "text-warning" : ""}>{template.event_name}</td>
            <td style={style} >{template.event_value}</td>
            <td>
              {edit_icon}{' '}
              {test_icon}{' '}
              {delete_icon}
            </td>
          </tr>
        );
      });
    }

    return (
      <tr key="noEventTemplatesFound">
        <td colSpan="3"> No event templates found!</td>
      </tr>
    );   
  }

  renderEventTemplatesTable() {

    if(this.props.event_templates && this.props.event_templates.filter(template => template.system_template === false).length > 0){
      return (
        <Table responsive bordered striped>
          <thead>
            <tr>
              <th>Button Name</th>
              <th>Event Value</th>
              <th style={{ width: "90px" }} >Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.renderEventTemplates()}
          </tbody>
        </Table>
      );
    } else {
      return (
        <Card.Body>
          No Event Templates found!
        </Card.Body>
      );
    }
  }

  renderSystemEventTemplatesTable() {

    if(this.props.event_templates && this.props.event_templates.filter(template => template.system_template === true).length > 0){
      return (
        <Table responsive bordered striped>
          <thead>
            <tr>
              <th>Button Name</th>
              <th>Event Value</th>
              <th style={{ width: "90px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {this.renderSystemEventTemplates()}
          </tbody>
        </Table>
      );
    } else {
      return (
        <Card.Body>No System Event Templates found!</Card.Body>
      );
    }
  }

  renderEventTemplatesHeader() {

    const Label = "Event Templates";

    // const importTooltip = (<Tooltip id="importTooltip">Import Event Templates</Tooltip>)
    const exportTooltip = (<Tooltip id="exportTooltip">Export Event Templates</Tooltip>);
    const deleteAllNonSystemTooltip = (<Tooltip id="deleteAllNonSystemTooltip">Delete ALL non-system Event Templates</Tooltip>);

    const disableBtn = (this.props.event_templates.filter(event_template => event_template.system_template === false).length > 0)? false : true;

    return (
      <div>
        { Label }
        <span className="float-right">
          <OverlayTrigger placement="top" overlay={deleteAllNonSystemTooltip}><FontAwesomeIcon disabled={disableBtn} onClick={ () => this.handleNonSystemEventTemplatesWipe() } icon='trash' fixedWidth/></OverlayTrigger>{' '}
          <OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon disabled={disableBtn} onClick={ () => this.exportTemplatesToJSON() } icon='download' fixedWidth/></OverlayTrigger>
        </span>
      </div>
    );
  }

  renderSystemEventTemplatesHeader() {

    const Label = "System Templates (Added/Edited by Admins only)";

    const exportTooltip = (<Tooltip id="exportTooltip">Export System Event Templates</Tooltip>);

    let export_icon = (this.props.roles.includes("admin"))? (<OverlayTrigger placement="top" overlay={exportTooltip}><FontAwesomeIcon onClick={ () => this.exportSystemTemplatesToJSON() } icon='download' fixedWidth/></OverlayTrigger>) : null;

    return (
      <div>
        { Label }
        <span className="float-right">
          {export_icon}
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

    if (this.props.roles.includes("admin") || this.props.roles.includes("event_manager")) {

      let eventTemplatesForm = (this.props.event_templateid)? <UpdateEventTemplate /> : <CreateEventTemplate />;

      return (
        <div>
          <DeleteEventTemplateModal />
          <NonSystemEventTemplatesWipeModal />
          <EventTemplateOptionsModal />
          <ImportEventTemplatesModal handleExit={this.handleEventTemplateImportClose} />
          <Row>
            <Col sm={12} md={8} lg={{span:6, offset:1}} xl={{span:5, offset:2}}>
              <Card style={{marginBottom: "8px"}} >
                <Card.Header>{this.renderSystemEventTemplatesHeader()}</Card.Header>
                {this.renderSystemEventTemplatesTable()}
              </Card>
              <Card style={{marginBottom: "8px"}} >
                <Card.Header>{this.renderEventTemplatesHeader()}</Card.Header>
                {this.renderEventTemplatesTable()}
              </Card>
              <div className="float-right" style={{marginRight: "-8px", marginBottom: "8px"}}>
                {this.renderImportEventTemplatesButton()}
                {this.renderAddEventTemplateButton()}
              </div>
            </Col>
            <Col sm={12} md={4} lg={4} xl={3}>
              { eventTemplatesForm }
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
    event_templates: state.event_template.event_templates,
    event_templateid: state.event_template.event_template.id,
    roles: state.user.profile.roles
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(EventTemplates);
