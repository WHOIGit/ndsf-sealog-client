import axios from 'axios';
import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { connect } from 'react-redux';
import { Accordion, Row, Col, Card } from 'react-bootstrap';
import FileDownload from 'js-file-download';
import CopyLoweringToClipboard from './copy_lowering_to_clipboard';
import CopyCruiseToClipboard from './copy_cruise_to_clipboard';
import { API_ROOT_URL, MAIN_SCREEN_TXT, DEFAULT_VESSEL } from '../client_config';

import * as mapDispatchToProps from '../actions';

const CRUISE_ROUTE = "/files/cruises";
const LOWERING_ROUTE = "/files/lowerings";

const cookies = new Cookies();

class CruiseMenu extends Component {

  constructor (props) {
    super(props);

    this.state = {
      years: null,
      activeYear: (this.props.cruise.start_ts) ? moment.utc(this.props.cruise.start_ts).format("YYYY") : null,
      yearCruises: null,
      activeCruise: (this.props.cruise.id) ? this.props.cruise : null,
      cruiseLowerings: null,
      activeLowering: (this.props.lowering.id) ? this.props.lowering : null,
    };

    this.handleYearSelect = this.handleYearSelect.bind(this);
    this.handleCruiseSelect = this.handleCruiseSelect.bind(this);
    this.handleLoweringSelect = this.handleLoweringSelect.bind(this);
    this.handleCruiseFileDownload = this.handleCruiseFileDownload.bind(this);
    this.handleLoweringFileDownload = this.handleLoweringFileDownload.bind(this);

  }

  componentDidMount() {
    this.props.fetchCruises();
    this.props.fetchLowerings();
  }


  componentDidUpdate(prevProps, prevState) {

    if(this.state.years !== prevState.years && this.state.years.size > 0) {
      // console.log("year list changed");
      this.buildCruiseList();
    }

    if(this.props.cruises !== prevProps.cruises && this.props.cruises.length > 0 ) {
      // console.log("cruise list changed");
      this.buildYearList();
      this.setState({ activeCruise: null, activeLowering: null })
    }

    if(this.state.activeCruise !== prevState.activeCruise && this.props.lowerings.length > 0 ) {
      // console.log("lowering list changed");
      this.buildLoweringList();
      this.setState({ activeLowering: null })
    }

    if(this.state.activeYear !== prevState.activeYear ) {
      // console.log("selected year changed");
      this.setState({ activeCruise: null, activeLowering: null })
    }

    if(this.props.cruise !== prevProps.cruise && this.props.cruise.id){
      // console.log("selected cruise changed");
      this.setState({activeYear: moment.utc(this.props.cruise.start_ts).format("YYYY"), activeCruise: this.props.cruise})
    }

    if(this.props.lowering !== prevProps.lowering && this.props.lowering.id){
      // console.log("selected lowering changed");
      this.setState({ activeLowering: this.props.lowering })
    }
  }

  componentWillUnmount() {
  }

  handleYearSelect(activeYear) {
    this.setState({ activeYear });
  }

  handleCruiseSelect(id) {
    if(this.state.activeCruise === null || this.state.activeCruise && this.state.activeCruise.id !== id) {
      window.scrollTo(0, 0);
      const activeCruise = this.props.cruises.find(cruise => cruise.id === id);
      // console.log("activeCruise:", activeCruise);
      this.setState({ activeCruise });
    }
  }

  handleLoweringSelect(id) {
    if(this.state.activeLowering === null || this.state.activeLowering && this.state.activeLowering.id !== id) {
      window.scrollTo(0, 0);
      const activeLowering = this.props.lowerings.find(lowering => lowering.id === id);
      // console.log("activeLowering:", activeLowering);
      this.setState({activeLowering: activeLowering});
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

  async handleLoweringFileDownload(loweringID, filename) {
    await axios.get(`${API_ROOT_URL}${LOWERING_ROUTE}/${loweringID}/${filename}`,
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

  async handleCruiseFileDownload(cruiseID, filename) {
    await axios.get(`${API_ROOT_URL}${CRUISE_ROUTE}/${cruiseID}/${filename}`,
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
      let loweringOnBottomTime = (this.state.activeLowering.lowering_additional_meta.milestones && this.state.activeLowering.lowering_additional_meta.milestones.lowering_on_bottom) ? moment.utc(this.state.activeLowering.lowering_additional_meta.milestones.lowering_on_bottom) : null;
      let loweringOffBottomTime = (this.state.activeLowering.lowering_additional_meta.milestones && this.state.activeLowering.lowering_additional_meta.milestones.lowering_off_bottom) ? moment.utc(this.state.activeLowering.lowering_additional_meta.milestones.lowering_off_bottom) : null;
      let loweringStopTime = moment.utc(this.state.activeLowering.stop_ts);

      let loweringDurationValue = loweringStopTime.diff(loweringStartTime);
      let decentDurationValue = (loweringOnBottomTime) ? loweringOnBottomTime.diff(loweringStartTime) : null;
      let onBottomDurationValue = (loweringOnBottomTime && loweringOffBottomTime) ? loweringOffBottomTime.diff(loweringOnBottomTime) : null;
      let ascentDurationValue = (loweringOffBottomTime) ? loweringStopTime.diff(loweringOffBottomTime) : null;


      let loweringDescription = (this.state.activeLowering.lowering_additional_meta.lowering_description)? <span><strong>Description:</strong> {this.state.activeLowering.lowering_additional_meta.lowering_description}<br/></span> : null;
      let loweringLocation = (this.state.activeLowering.lowering_location)? <span><strong>Location:</strong> {this.state.activeLowering.lowering_location}<br/></span> : null;
      let loweringStarted = <span><strong>Started:</strong> {loweringStartTime.format("YYYY-MM-DD HH:mm")}<br/></span>;
      let loweringDuration = <span><strong>Duration:</strong> {moment.duration(loweringDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span>;
      let loweringDescentDuration = (decentDurationValue) ? <span><strong>Descent:</strong> {moment.duration(decentDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span> : null;
      let loweringOnBottomDuration = (onBottomDurationValue) ? <span><strong>On Bottom:</strong> {moment.duration(onBottomDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span> : null;
      let loweringAscentDuration = (ascentDurationValue) ? <span><strong>Ascent:</strong> {moment.duration(ascentDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span> : null;

      let loweringMaxDepth = (this.state.activeLowering.lowering_additional_meta.stats && this.state.activeLowering.lowering_additional_meta.stats.max_depth)? <span><strong>Max Depth:</strong> {this.state.activeLowering.lowering_additional_meta.stats.max_depth}<br/></span>: null;
      let loweringBoundingBox = (this.state.activeLowering.lowering_additional_meta.stats && this.state.activeLowering.lowering_additional_meta.stats.bounding_box)? <span><strong>Bounding Box:</strong> {this.state.activeLowering.lowering_additional_meta.stats.bounding_box.join(', ')}<br/></span>: null;

      let loweringFiles = (this.state.activeLowering.lowering_additional_meta.lowering_files && this.state.activeLowering.lowering_additional_meta.lowering_files.length > 0)? <span><strong>Files:</strong><br/>{this.renderLoweringFiles(this.state.activeLowering.id, this.state.activeLowering.lowering_additional_meta.lowering_files)}</span>: null;

      return (          
        <Card key={`lowering_card`}>
          <Card.Header>Lowering: <span className="text-warning">{this.state.activeLowering.lowering_id}</span><span className="float-right"><CopyLoweringToClipboard lowering={this.state.activeLowering}/></span></Card.Header>
          <Card.Body>
            {loweringDescription}
            {loweringLocation}
            {loweringStarted}
            {loweringDuration}
            {loweringDescentDuration}
            {loweringOnBottomDuration}
            {loweringAscentDuration}
            {loweringMaxDepth}
            {loweringBoundingBox}
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

      let cruiseStartTime = moment.utc(this.state.activeCruise.start_ts);
      let cruiseStopTime = moment.utc(this.state.activeCruise.stop_ts);
      let cruiseDurationValue = cruiseStopTime.diff(cruiseStartTime);

      let cruiseFiles = (this.state.activeCruise.cruise_additional_meta.cruise_files && this.state.activeCruise.cruise_additional_meta.cruise_files.length > 0)? this.renderCruiseFiles(this.state.activeCruise.id, this.state.activeCruise.cruise_additional_meta.cruise_files): null;

      let cruiseName = (this.state.activeCruise.cruise_additional_meta.cruise_name)? <span><strong>Cruise Name:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_name}<br/></span> : null;
      let cruiseDescription = (this.state.activeCruise.cruise_additional_meta.cruise_description)? <span><strong>Description:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_description}<br/></span> : null;
      let cruiseVessel = <span><strong>Vessel:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_vessel}<br/></span>;
      let cruiseLocation = (this.state.activeCruise.cruise_location)? <span><strong>Location:</strong> {this.state.activeCruise.cruise_location}<br/></span> : null;
      let cruisePorts = (this.state.activeCruise.cruise_additional_meta.cruise_departure_location)? <span><strong>Ports:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_departure_location} <FontAwesomeIcon icon='arrow-right' fixedWidth /> {this.state.activeCruise.cruise_additional_meta.cruise_arrival_location}<br/></span> : null;
      let cruiseDates = <span><strong>Dates:</strong> {cruiseStartTime.format("YYYY/MM/DD")} <FontAwesomeIcon icon='arrow-right' fixedWidth /> {cruiseStopTime.format("YYYY/MM/DD")}<br/></span>;
      let cruisePi = <span><strong>Chief Scientist:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_pi}<br/></span>;
      let cruiseLowerings = this.props.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(cruiseStartTime, cruiseStopTime));
      // let cruiseLinkToR2R = (this.state.activeCruise.cruise_additional_meta.cruise_linkToR2R)? <span><strong>R2R Cruise Link :</strong> <a href={`${this.state.activeCruise.cruise_additional_meta.cruise_linkToR2R}`} target="_blank"><FontAwesomeIcon icon='link' fixedWidth/></a><br/></span> : null

      let cruiseDuration = <span><strong>Duration:</strong> {moment.duration(cruiseDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span>;

      let lowerings = (cruiseLowerings.length > 0)? (
        <ul>
          { cruiseLowerings.map((lowering) => {
            if(this.state.activeLowering && lowering.id === this.state.activeLowering.id) {
              return (<li key={`select_${lowering.id}`} ><span className="text-warning">{lowering.lowering_id}</span><br/></li>);
            }

            return (<li key={`select_${lowering.id}`} ><span className={(this.state.activeLowering && lowering.id === this.state.activeLowering.id) ? "text-warning" : "text-primary"} onClick={ () => this.handleLoweringSelect(lowering.id) }>{lowering.lowering_id}</span><br/></li>);
          })
          }
        </ul>
      ): null;

      return (          
        <Card key={`cruise_${this.state.activeCruise.cruise_id}`}>
          <Card.Header>Cruise: <span className="text-warning">{this.state.activeCruise.cruise_id}</span><span className="float-right"><CopyCruiseToClipboard cruise={this.state.activeCruise} cruiseLowerings={cruiseLowerings}/></span></Card.Header>
          <Card.Body>
            {cruiseName}
            {cruisePi}
            {cruiseDescription}
            {cruiseVessel}
            {cruiseLocation}
            {cruiseDates}
            {cruisePorts}
            {cruiseDuration}
            {cruiseFiles}
            {
              (cruiseLowerings && cruiseLowerings.length > 0)? (
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

    const activeYear = (years.size == 1) ? years.values().next().value : null;

    this.setState({years});
  }

  buildCruiseList() {

    const yearCruises = {}

    if (this.state.years && this.state.years.size > 0) {
      this.state.years.forEach((year) => {

        // let cruise_start_ts = new Date(Date.UTC(year));
        // console.log("cruise_start_ts:", cruise_start_ts);
        // let startOfYear1 = new Date(Date.UTC(cruise_start_ts.getFullYear(), 0, 1, 0, 0, 0));
        // console.log("startOfYear1:", startOfYear1);
        // let endOfYear1 = new Date(Date.UTC(cruise_start_ts.getFullYear(), 11, 31, 23, 59, 59));
        // console.log("endOfYear1:", endOfYear1);

        let startOfYear = new Date(year);
        // console.log("startOfYear:", startOfYear);
        let endOfYear = new Date(startOfYear.getFullYear()+1, startOfYear.getMonth(), startOfYear.getDate());
        // console.log("endOfYear:", endOfYear);

        // let yearCruises = this.props.cruises.filter(cruise => moment.utc(cruise.start_ts).isBetween(startOfYear, endOfYear));
        const yearCruisesTemp = this.props.cruises.filter(cruise => moment.utc(cruise.start_ts).isBetween(moment.utc(startOfYear), moment.utc(endOfYear)))
        // console.log("yearCruisesTemp:",yearCruisesTemp);
        yearCruises[year] = yearCruisesTemp.map((cruise) => { return { id: cruise.id, cruise_id: cruise.cruise_id } } );
      });

      // console.log('yearCruises:', yearCruises)
      this.setState({ yearCruises });
    }
  }

  buildLoweringList() {

    if ( this.state.activeCruise ) {
      let startOfCruise = new Date(this.state.activeCruise.start_ts);
      // console.log("startOfYear:", startOfYear);
      let endOfCruise = new Date(this.state.activeCruise.stop_ts);
      // console.log("endOfYear:", endOfYear);

      const cruiseLoweringsTemp = this.props.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(moment.utc(startOfCruise), moment.utc(endOfCruise)))
      // console.log("yearCruisesTemp:",yearCruisesTemp);
      const cruiseLowerings = cruiseLoweringsTemp.map((lowering) => { return { id: lowering.id, lowering_id: lowering.lowering_id } } );

      // console.log('cruiseLowerings:', cruiseLowerings)
      this.setState({ cruiseLowerings });
    }


    // // let cruise_start_ts = new Date(Date.UTC(year));
    // // console.log("cruise_start_ts:", cruise_start_ts);
    // // let startOfYear1 = new Date(Date.UTC(cruise_start_ts.getFullYear(), 0, 1, 0, 0, 0));
    // // console.log("startOfYear1:", startOfYear1);
    // // let endOfYear1 = new Date(Date.UTC(cruise_start_ts.getFullYear(), 11, 31, 23, 59, 59));
    // // console.log("endOfYear1:", endOfYear1);

    // let startOfYear = new Date(year);
    // // console.log("startOfYear:", startOfYear);
    // let endOfYear = new Date(startOfYear.getFullYear()+1, startOfYear.getMonth(), startOfYear.getDate());
    // // console.log("endOfYear:", endOfYear);

    // // let yearCruises = this.props.cruises.filter(cruise => moment.utc(cruise.start_ts).isBetween(startOfYear, endOfYear));
    // const yearCruisesTemp = this.props.cruises.filter(cruise => moment.utc(cruise.start_ts).isBetween(moment.utc(startOfYear), moment.utc(endOfYear)))
    // // console.log("yearCruisesTemp:",yearCruisesTemp);
    // yearCruises[year] = yearCruisesTemp.map((cruise) => { return { id: cruise.id, cruise_id: cruise.cruise_id } } );

    // // console.log('yearCruises:', yearCruises)
    // this.setState({ cruiseLowerings });
}

  renderYearListItems() {

    const yearCards = []

    if (this.state.yearCruises) {
      Object.entries(this.state.yearCruises).forEach(([year,cruises])=>{
        // console.log(`${year}:${cruises.join(", ")}`)

        let yearTxt = <span className="text-primary">{year}</span> 

        let yearCruises = (
          <ul>
            {
              cruises.map((cruise) => {
                return (<li key={`select_${cruise.id}`} ><span className={(this.state.activeCruise && cruise.id === this.state.activeCruise.id) ? "text-warning" : "text-primary"} onClick={ () => this.handleCruiseSelect(cruise.id) }>{cruise.cruise_id}</span><br/></li>);
              })
            }
          </ul>
        );

        if (this.state.years.size > 1) {
          yearCards.unshift(
            <Card key={`year_${year}`} >
              <Accordion.Toggle as={Card.Header} eventKey={year}>
                <h6>Year: {yearTxt}</h6>
              </Accordion.Toggle>
              <Accordion.Collapse eventKey={year}>
                <Card.Body>
                  <strong>Cruises:</strong>
                  {yearCruises}
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          );
        }
        else {
          yearCards.push(
            <Card key={`year_${year}`} >
              <Card.Header>Year: {yearTxt}</Card.Header>
              <Card.Body>
                <strong>Cruises:</strong>
                {yearCruises}
              </Card.Body>
            </Card>
          );
        }
      })
    }

    return yearCards;
 
  }

  renderCruiseListItems() {

    return this.props.cruises.map((cruise) => {

      let cruiseName = (cruise.cruise_additional_meta.cruise_name)? <span><strong>Cruise Name:</strong> {cruise.cruise_additional_meta.cruise_name}<br/></span> : null;
      let cruiseDescription = (cruise.cruise_additional_meta.cruise_description)? <span><strong>Description:</strong> {cruise.cruise_additional_meta.cruise_description}<br/></span> : null;
      let cruiseLocation = (cruise.cruise_location)? <span><strong>Location:</strong> {cruise.cruise_location}<br/></span> : null;
      let cruiseDates = <span><strong>Dates:</strong> {moment.utc(cruise.start_ts).format("YYYY/MM/DD")} - {moment.utc(cruise.stop_ts).format("YYYY/MM/DD")}<br/></span>;
      let cruisePI = <span><strong>Chief Scientist:</strong> {cruise.cruise_additional_meta.cruise_pi}<br/></span>;
      let cruiseVessel = <span><strong>Vessel:</strong> {cruise.cruise_additional_meta.cruise_vessel}<br/></span>;
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
              {cruiseVessel}
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

    if(this.state.years && this.state.years.size > 1) {
      return (
        <Accordion id="accordion-controlled-year" activeKey={this.state.activeYear} onSelect={this.handleYearSelect}>
          {this.renderYearListItems()}
        </Accordion>
      );
    } else if(this.state.years && this.state.years.size > 0) {
      return (
        this.renderYearListItems()
      )
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
        <Accordion id="accordion-controlled-example" activeKey={this.state.activeCruise} onSelect={this.handleCruiseSelect}>
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
