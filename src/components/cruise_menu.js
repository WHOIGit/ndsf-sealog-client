import axios from 'axios';
import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { Accordion, Row, Col, Card } from 'react-bootstrap';
import FileDownload from 'js-file-download';
import { API_ROOT_URL, MAIN_SCREEN_TXT } from '../client_config';

import * as mapDispatchToProps from '../actions';

const CRUISE_ROUTE = "/files/cruises";
const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class CruiseMenu extends Component {

  constructor (props) {
    super(props);

    this.state = {
      activeYearKey: null,
      years: null,
      activeCruiseKey: null,
      cruiseLowerings: null,
      activeCruise: null,
      activeLowering: null

    };

    this.handleYearSelect = this.handleYearSelect.bind(this);
    this.handleCruiseSelect = this.handleCruiseSelect.bind(this);
    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleCruiseFileDownload = this.handleCruiseFileDownload.bind(this);
    this.handleLoweringFileDownload = this.handleLoweringFileDownload.bind(this);

  }

  componentDidMount(){
    this.props.fetchCruises();
    this.props.fetchLowerings();
  }

  componentDidUpdate(){

    if(this.props.cruises.length > 0 && this.state.years === null) {
      this.buildYearList();
    }

    if(this.props.cruise && this.props.cruise.id && this.props.cruises.length > 0 && this.props.lowerings.length > 0 && this.state.activeCruise === null) {
      this.handleYearSelect(moment.utc(this.props.cruise.start_ts).format("YYYY"));
      this.handleCruiseSelect(this.props.cruise.id);
    }

    if(this.state.activeCruise === null && this.state.activeLowering !== null) {
      this.handleLoweringSelect();
    }
    else if(this.props.lowering.id && this.props.lowerings.length > 0 && this.state.activeLowering === null) {
      this.handleLoweringSelect(this.props.lowering.id);
    }


    // if(this.props.cruise.id && this.props.lowerings.length > 0 && this.state.activeCruise === null) {
    //   // console.log("selected cruise but no active cruise")
    //   this.handleCruiseSelect(this.props.cruise.id)
    //   this.buildLoweringList(this.props.cruise.start_ts, this.props.cruise.stop_ts)
    // }
    // // else if(this.props.cruises.length > 0 && this.props.lowerings.length > 0 && this.state.activeCruise === null) {
    // //   console.log("cruiselist but no active cruise")
    // //   this.handleCruiseSelect(this.props.cruises[0].id)
    // //   this.buildLoweringList(this.props.cruises[0].start_ts, this.props.cruises[0].stop_ts)
    // // }

    // if(this.props.lowering.id && this.props.lowerings.length > 0 && this.state.activeLowering === null) {
    //   // console.log("selected lowering but there is no active lowering")
    //   this.handleLoweringSelect(this.props.lowering.id)
    // }

    // if(this.state.activeCruise !== null && this.state.cruiseLowerings === null) {
    //   // console.log("active cruise but null cruise lowerings")
    //   this.buildLoweringList(this.state.activeCruise.start_ts, this.state.activeCruise.stop_ts)
    // }

    // if(this.state.activeCruise === null && this.state.activeLowering !== null) {
    //   // console.log("no active cruise but there is an active lowering")
    //   this.handleLoweringSelect();
    // }
  }

  componentWillUnmount(){
  }

  handleCruiseSelect(id) {
    if(this.state.activeCruise === null || this.state.activeCruise && this.state.activeCruise.id !== id) {
      window.scrollTo(0, 0);
      const activeCruise = this.props.cruises.find(cruise => cruise.id === id);
      this.buildLoweringList(activeCruise.start_ts, activeCruise.stop_ts);
      this.setState({activeCruiseKey: activeCruise.id, activeCruise: activeCruise});
      this.handleLoweringSelect();
    }
  }

  handleLoweringSelect(id = null) {
    window.scrollTo(0, 0);
    if(id !== null) {
      this.setState({activeLowering: this.props.lowerings.find(lowering => lowering.id === id)});
    } else {
      this.props.clearSelectedLowering();
      this.setState({activeLowering: null});
    }
  }

  handleLoweringSelectForReplay() {
    if(this.state.activeLowering) {
      this.props.clearEvents();
      this.props.gotoLoweringReplay(this.state.activeLowering.id);
    }
  }

  handleLoweringSelectForReview() {
    if(this.state.activeLowering) {
      this.props.clearEvents();
      this.props.gotoLoweringReview(this.state.activeLowering.id);
    }
  }

  handleLoweringSelectForMap() {
    if(this.state.activeLowering) {
      this.props.clearEvents();
      this.props.gotoLoweringMap(this.state.activeLowering.id);
    }
  }

  handleLoweringSelectForGallery() {
    if(this.state.activeLowering) {
      this.props.clearEvents();
      this.props.gotoLoweringGallery(this.state.activeLowering.id);
    }
  }

  handleLoweringFileDownload(loweringID, filename) {
    axios.get(`${API_ROOT_URL}${LOWERING_ROUTE}/${loweringID}/${filename}`,
      {
        headers: {
          authorization: cookies.get('token')
        },
        responseType: 'arraybuffer'
      })
      .then((response) => {
        FileDownload(response.data, filename);
      })
      .catch(()=>{
        console.log("JWT is invalid, logging out");
      });
  }

  handleCruiseFileDownload(cruiseID, filename) {
    axios.get(`${API_ROOT_URL}${CRUISE_ROUTE}/${cruiseID}/${filename}`,
      {
        headers: {
          authorization: cookies.get('token')
        },
        responseType: 'arraybuffer'
      })
      .then((response) => {
        FileDownload(response.data, filename);
      })
      .catch(()=>{
        console.log("JWT is invalid, logging out");
      });
  }

  handleYearSelect(activeYearKey) {
    if(this.state.activeYearKey !== activeYearKey) {
      this.setState({ activeYearKey: activeYearKey, activeCruise: null, activeLowering: null});
      this.buildCruiseList(activeYearKey);
    }
  }


  renderCruiseFiles(cruiseID, files) {
    let output = files.map((file, index) => {
      return <li style={{ listStyleType: "none" }} key={`file_${index}`}><span onClick={() => this.handleCruiseFileDownload(cruiseID, file)}><FontAwesomeIcon className='text-primary' icon='download' fixedWidth /></span><span> {file}</span></li>;
    });
    return <div>{output}<br/></div>;
  }

  renderLoweringFiles(loweringID, files) {
    let output = files.map((file, index) => {
      return <li style={{ listStyleType: "none" }} key={`file_${index}`}><span onClick={() => this.handleLoweringFileDownload(loweringID, file)}><FontAwesomeIcon className='text-primary' icon='download' fixedWidth /></span><span> {file}</span></li>;
    });
    return <div>{output}<br/></div>;
  }

  renderLoweringCard() {

    if(this.state.activeLowering){
      let loweringStartTime = moment.utc(this.state.activeLowering.start_ts);
      let loweringEndTime = moment.utc(this.state.activeLowering.stop_ts);
      let loweringDurationValue = loweringEndTime.diff(loweringStartTime);

      let loweringDescription = (this.state.activeLowering.lowering_additional_meta.lowering_description)? <span><strong>Description:</strong> {this.state.activeLowering.lowering_additional_meta.lowering_description}<br/></span> : null;
      let loweringLocation = (this.state.activeLowering.lowering_location)? <span><strong>Location:</strong> {this.state.activeLowering.lowering_location}<br/></span> : null;
      let loweringStarted = <span><strong>Started:</strong> {loweringStartTime.format("YYYY-MM-DD HH:mm")}<br/></span>;
      let loweringDuration = <span><strong>Duration:</strong> {moment.duration(loweringDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span>;
      let loweringFiles = (this.state.activeLowering.lowering_additional_meta.lowering_files && this.state.activeLowering.lowering_additional_meta.lowering_files.length > 0)? <span><strong>Files:</strong><br/>{this.renderLoweringFiles(this.state.activeLowering.id, this.state.activeLowering.lowering_additional_meta.lowering_files)}</span>: null;

      return (          
        <Card key={`lowering_card`}>
          <Card.Header>Lowering: <span className="text-warning">{this.state.activeLowering.lowering_id}</span></Card.Header>
          <Card.Body>
            {loweringDescription}
            {loweringLocation}
            {loweringStarted}
            {loweringDuration}
            {loweringFiles}
            <br/>
            <Row>
              <Col sm={12} md={6} xl={3}>
                <div className="text-primary" onClick={ () => this.handleLoweringSelectForReplay() }>Goto replay<FontAwesomeIcon icon='arrow-right' fixedWidth /></div>
              </Col>
              <Col sm={12} md={6} xl={3}>
                <div className="text-primary" onClick={ () => this.handleLoweringSelectForReview() }>Goto review<FontAwesomeIcon icon='arrow-right' fixedWidth /></div>
              </Col>
              <Col sm={12} md={6} xl={3}>
                <div className="text-primary" onClick={ () => this.handleLoweringSelectForMap() }>Goto map<FontAwesomeIcon icon='arrow-right' fixedWidth /></div>
              </Col>
              <Col sm={12} md={6} xl={3}>
                <div className="text-primary" onClick={ () => this.handleLoweringSelectForGallery() }>Goto gallery<FontAwesomeIcon icon='arrow-right' fixedWidth /></div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      );
    }
  }

  renderCruiseCard() {

    if(this.state.activeCruise) {

      let cruiseFiles = (this.state.activeCruise.cruise_additional_meta.cruise_files && this.state.activeCruise.cruise_additional_meta.cruise_files.length > 0)? this.renderCruiseFiles(this.state.activeCruise.id, this.state.activeCruise.cruise_additional_meta.cruise_files): null;

      let cruiseName = (this.state.activeCruise.cruise_additional_meta.cruise_name)? <span><strong>Cruise Name:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_name}<br/></span> : null;
      let cruiseDescription = (this.state.activeCruise.cruise_additional_meta.cruise_description)? <span><strong>Description:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_description}<br/></span> : null;
      let cruiseVessel = (this.state.activeCruise.cruise_additional_meta.cruise_vessel)? <span><strong>Vessel:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_vessel}<br/></span> : null;
      let cruiseLocation = (this.state.activeCruise.cruise_location)? <span><strong>Location:</strong> {this.state.activeCruise.cruise_location}<br/></span> : null;
      let cruiseDates = <span><strong>Dates:</strong> {moment.utc(this.state.activeCruise.start_ts).format("YYYY/MM/DD")} - {moment.utc(this.state.activeCruise.stop_ts).format("YYYY/MM/DD")}<br/></span>;
      let cruisePi = (this.state.activeCruise.cruise_pi)? <span><strong>Chief Scientist:</strong> {this.state.activeCruise.cruise_pi}<br/></span> : null;
      let cruiseLowerings = this.props.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(moment.utc(this.state.activeCruise.start_ts), moment.utc(this.state.activeCruise.stop_ts)));
      // let cruiseLinkToR2R = (this.state.activeCruise.cruise_additional_meta.cruise_linkToR2R)? <span><strong>R2R Cruise Link :</strong> <a href={`${this.state.activeCruise.cruise_additional_meta.cruise_linkToR2R}`} target="_blank"><FontAwesomeIcon icon='link' fixedWidth/></a><br/></span> : null

      let lowerings = (cruiseLowerings.length > 0)? (
        <ul>
          { cruiseLowerings.map((lowering) => {
            if(this.state.activeLowering && lowering.id === this.state.activeLowering.id) {
              return (<li key={`select_${lowering.id}`} ><span className="text-warning">{lowering.lowering_id}</span><br/></li>);
            }

            return (<li key={`select_${lowering.id}`} ><Link to="#" onClick={ () => this.handleLoweringSelect(lowering.id) }>{lowering.lowering_id}</Link><br/></li>);
          })
          }
        </ul>
      ): null;

      return (          
        <Card key={`cruise_${this.state.activeCruise.cruise_id}`}>
          <Card.Header>Cruise: <span className="text-warning">{this.state.activeCruise.cruise_id}</span></Card.Header>
          <Card.Body>
            {cruiseName}
            {cruiseDescription}
            {cruiseVessel}
            {cruiseLocation}
            {cruiseDates}
            {cruisePi}
            {cruiseFiles}
            { (cruiseLowerings && cruiseLowerings.length > 0)? (
              <div>
                <p><strong>Lowerings:</strong></p>
                {lowerings}
              </div>
            ): null
            }
          </Card.Body>
        </Card>
      );
    }      
  }


  buildYearList() {

    const years = new Set(this.props.cruises.map((cruise) => {
      return moment.utc(cruise.start_ts).format("YYYY");
    }));

    const activeYearKey = (years.size == 1) ? years.values().next().value : null;

    this.setState({years});

    this.handleYearSelect(activeYearKey);
  }

  buildCruiseList(year) {
    let startOfYear = new Date(year);
    let endOfYear = new Date(startOfYear.getFullYear()+1, startOfYear.getMonth(), startOfYear.getDate());
    // let yearCruises = this.props.cruises.filter(cruise => moment.utc(cruise.start_ts).isBetween(startOfYear, endOfYear));
    let yearCruises = this.props.cruises.filter(cruise => moment.utc(cruise.start_ts).isBetween(moment.utc(startOfYear), moment.utc(endOfYear)));

    this.setState({ yearCruises });

    if(yearCruises.length === 1 && this.state.activeCruise === null) {
      this.handleCruiseSelect(yearCruises[0].id);
    }
  }

  buildLoweringList(start_ts, stop_ts) {
    this.setState({ cruiseLowerings: this.props.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(start_ts, stop_ts)) });
  }

  renderYearListItems() {

    let years = [];

    let cruises = (this.state.yearCruises)? (
      <ul>
        { this.state.yearCruises.map((cruise) => {
          if(this.state.activeCruise && cruise.id === this.state.activeCruise.id) {
            return (<li key={`select_${cruise.id}`} ><span className="text-warning">{cruise.cruise_id}</span><br/></li>);
          }

          return (<li key={`select_${cruise.id}`} ><Link to="#" onClick={ () => this.handleCruiseSelect(cruise.id) }>{cruise.cruise_id}</Link><br/></li>);
        })
        }
      </ul>
    ): null;

    this.state.years.forEach((year) => {

      let yearTxt = null;
      if(year == this.state.activeYearKey) {
        yearTxt = <span className="text-warning">{year}</span>
      }
      else {
        yearTxt = <span className="text-primary">{year}</span> 
      }

      years.push(          
        <Card key={`year_${year}`} >
          <Accordion.Toggle as={Card.Header} eventKey={year}>
            <h6>Year: {yearTxt}</h6>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey={year}>
            <Card.Body>
              <strong>Cruises:</strong>
              {cruises}
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      );
    });

    return years;    
  }

  renderCruiseListItems() {

    return this.props.cruises.map((cruise) => {

      let cruiseName = (cruise.cruise_additional_meta.cruise_name)? <span><strong>Cruise Name:</strong> {cruise.cruise_additional_meta.cruise_name}<br/></span> : null;
      let cruiseDescription = (cruise.cruise_additional_meta.cruise_description)? <span><strong>Description:</strong> {cruise.cruise_additional_meta.cruise_description}<br/></span> : null;
      let cruiseLocation = (cruise.cruise_location)? <span><strong>Location:</strong> {cruise.cruise_location}<br/></span> : null;
      let cruiseDates = <span><strong>Dates:</strong> {moment.utc(cruise.start_ts).format("YYYY/MM/DD")} - {moment.utc(cruise.stop_ts).format("YYYY/MM/DD")}<br/></span>;
      let cruisePI = <span><strong>Chief Scientist:</strong> {cruise.cruise_pi}<br/></span>;
      let cruiseFiles = (cruise.cruise_additional_meta.cruise_files && cruise.cruise_additional_meta.cruise_files.length > 0)? <span><strong>Files:</strong><br/>{this.renderCruiseFiles(cruise.id, cruise.cruise_additional_meta.cruise_files)}</span>: null;
      
      let lowerings = (this.state.cruiseLowerings)? (
        <ul>
          { this.state.cruiseLowerings.map((lowering) => {
            if(this.state.activeLowering && lowering.id === this.state.activeLowering.id) {
              return (<li key={`select_${lowering.id}`} ><span className="text-warning">{lowering.lowering_id}</span><br/></li>);
            }

            return (<li key={`select_${lowering.id}`} onClick={ () => this.handleLoweringSelect(lowering.id)}><span className="text-primary">{lowering.lowering_id}</span></li>);
          })
          }
        </ul>
      ): null;

      return (          
        <Card key={cruise.id} >
          <Accordion.Toggle as={Card.Header} eventKey={cruise.id}>
            <h6>Cruise: <span className="text-primary">{cruise.cruise_id}</span></h6>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey={cruise.id}>
            <Card.Body>
              {cruiseName}
              {cruiseDescription}
              {cruiseLocation}
              {cruiseDates}
              {cruisePI}
              {cruiseFiles}
              {
                (this.state.cruiseLowerings && this.state.cruiseLowerings.length > 0)? (
                  <div>
                    <p><strong>Lowerings:</strong></p>
                    {lowerings}
                  </div>
                ): null
              }
            </Card.Body>
          </Accordion.Collapse>
        </Card>
      );
    });      
  }

  renderYearList() {

    if(this.state.years && this.state.years.size > 0){
      return (
        <Accordion id="accordion-controlled-year" activeKey={this.state.activeYearKey} onSelect={this.handleYearSelect}>
          {this.renderYearListItems()}
        </Accordion>
      );
    }

    return (
      <Card>
        <Card.Body>No cruises found!</Card.Body>
      </Card>
    );
  }

  renderCruiseList() {

    if(this.props.cruises && this.props.cruises.length > 0) {

      return (
        <Accordion id="accordion-controlled-example" activeKey={this.state.activeCruiseKey} onSelect={this.handleCruiseSelect}>
          {this.renderCruiseListItems()}
        </Accordion>
      );
    }

    return (
      <Card>
        <Card.Body>No cruises found!</Card.Body>
      </Card>
    );
  }


  render(){
    return (
      <div>
        <Row>
          <Col xs={12}>
            <h4>Welcome to Sealog</h4>
            {MAIN_SCREEN_TXT}
            <br/><br/>
          </Col>
        </Row>
        <Row>
          <Col sm={3} md={3} lg={2}>
            {this.renderYearList()}
          </Col>
          <Col sm={4} md={4} lg={5}>
            {this.renderCruiseCard()}
          </Col>
          <Col sm={5} md={5} lg={5}>
            {this.renderLoweringCard()}
          </Col>
        </Row>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    cruise: state.cruise.cruise,
    cruises: state.cruise.cruises,
    lowering: state.lowering.lowering,  
    lowerings: state.lowering.lowerings,  
    roles: state.user.profile.roles
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CruiseMenu);
