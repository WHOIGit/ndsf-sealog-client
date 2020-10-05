import axios from 'axios';
import React, { Component } from 'react';
import Cookies from 'universal-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import moment from 'moment';
import momentDurationFormatSetup from 'moment-duration-format';
import { connect } from 'react-redux';
import { Accordion, Button, Row, Col, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
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
      const currentCruise = (this.props.cruises) ? this.props.cruises.find((cruise) => {
        const now = moment.utc();
        return (now.isBetween(moment.utc(cruise.start_ts), moment.utc(cruise.stop_ts)));
      }) : null;
      (currentCruise) ? this.buildLoweringList() : null;

      this.setState({ activeYear: (currentCruise) ? moment.utc(currentCruise.start_ts).format("YYYY") : null, activeCruise: (currentCruise) ? currentCruise : null, activeLowering: null });

    }

    if(this.props.lowerings !== prevProps.lowerings && this.props.lowerings.length > 0 ) {
      // console.log("lowering list changed");
      const currentCruise = (this.props.cruises) ? this.props.cruises.find((cruise) => {
        const now = moment.utc();
        return (now.isBetween(moment.utc(cruise.start_ts), moment.utc(cruise.stop_ts)));
      }) : null;

      if(this.state.activeCruise === currentCruise && this.state.activeLowering === null) {
        const cruiseLowerings = (currentCruise) ? this.props.lowerings.filter((lowering) => {
          return moment.utc(lowering.start_ts).isBetween(moment.utc(currentCruise.start_ts), moment.utc(currentCruise.stop_ts));
        }) : [];

        this.setState({ activeLowering: (cruiseLowerings.length > 0) ? this.props.lowerings.find((lowering) => lowering.lowering_id == cruiseLowerings[0].lowering_id) : null });
      }
    }

    if(this.state.activeCruise !== prevState.activeCruise && this.props.lowerings.length > 0 ) {
      // console.log("active cruise changed");
      this.buildLoweringList();
      this.setState({ activeLowering: null })
    }

    if(this.state.activeYear !== prevState.activeYear && prevState.activeYear !== null ) {
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

    if(this.state.cruiseLowerings !== prevState.cruiseLowerings ) {
      // console.log("cruise lowerings changed");

      // if the active cruise was selected, set the active lowering to the most recent lowering
      const currentCruise = (this.props.cruises) ? this.props.cruises.find((cruise) => {
        const now = moment.utc();
        return (now.isBetween(moment.utc(cruise.start_ts), moment.utc(cruise.stop_ts)));
      }) : null;

      this.setState({ activeLowering: (this.state.activeCruise == currentCruise && this.state.cruiseLowerings.length > 0) ? this.props.lowerings.find((lowering) => lowering.lowering_id == this.state.cruiseLowerings[0].lowering_id) : null });
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

  async handleLoweringFileDownload(filename) {
    await axios.get(`${API_ROOT_URL}${LOWERING_ROUTE}/${this.state.activeLowering.id}/${filename}`,
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

  async handleCruiseFileDownload(filename) {
    await axios.get(`${API_ROOT_URL}${CRUISE_ROUTE}/${this.state.activeCruise.id}/${filename}`,
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

  handleEventShowSVProfileModal(lowering) {
    this.props.showModal('svProfile', { lowering: lowering });
  }

  handleEventShowStatForROVTeamModal(cruise) {
    this.props.showModal('statsForROVTeam', { cruise: cruise });
  }


  // renderFiles() {
  //   if(this.props.cruise.cruise_additional_meta && this.props.cruise.cruise_additional_meta.cruise_files && this.props.cruise.cruise_additional_meta.cruise_files.length > 0) {
  //     let files = this.props.cruise.cruise_additional_meta.cruise_files.map((file, index) => {
  //       return <div className="pl-2" key={`file_${index}`}><a className="text-decoration-none" href="#"  onClick={() => this.handleFileDownload(file)}>{file}</a> <FontAwesomeIcon onClick={() => this.handleFileDeleteModal(file)} className='text-danger' icon='trash' fixedWidth /></div>
  //     })

  //     return (
  //       <div className="mb-2">
  //         {files}
  //       </div>
  //     )
  //   }
      
  //   return null
  // }

  renderCruiseFiles(files) {
    let output = files.map((file, index) => {
      return <div className="pl-2" key={`file_${index}`}><a className="text-decoration-none" href="#"  onClick={() => this.handleCruiseFileDownload(file)}>{file}</a></div>
    });
    return <div>{output}<br/></div>;
  }

  renderLoweringFiles(files) {
    let output = files.map((file, index) => {
      return <div className="pl-2" key={`file_${index}`}><a className="text-decoration-none" href="#"  onClick={() => this.handleLoweringFileDownload(file)}>{file}</a></div>
    });
    return <div>{output}<br/></div>;
  }

  renderLoweringCard() {
    // console.log(this.state.activeLowering)

    if(this.state.activeLowering){
      let loweringStartTime = moment.utc(this.state.activeLowering.start_ts);
      let loweringOffDeckTime = (this.state.activeLowering.lowering_additional_meta.milestones && this.state.activeLowering.lowering_additional_meta.milestones.lowering_off_deck) ? moment.utc(this.state.activeLowering.lowering_additional_meta.milestones.lowering_off_deck) : null;
      let loweringDescendingTime = (this.state.activeLowering.lowering_additional_meta.milestones && this.state.activeLowering.lowering_additional_meta.milestones.lowering_vents_secured) ? moment.utc(this.state.activeLowering.lowering_additional_meta.milestones.lowering_vents_secured) : null;
      let loweringOnBottomTime = (this.state.activeLowering.lowering_additional_meta.milestones && this.state.activeLowering.lowering_additional_meta.milestones.lowering_on_bottom) ? moment.utc(this.state.activeLowering.lowering_additional_meta.milestones.lowering_on_bottom) : null;
      let loweringOffBottomTime = (this.state.activeLowering.lowering_additional_meta.milestones && this.state.activeLowering.lowering_additional_meta.milestones.lowering_off_bottom) ? moment.utc(this.state.activeLowering.lowering_additional_meta.milestones.lowering_off_bottom) : null;
      let loweringOnSurfaceTime = (this.state.activeLowering.lowering_additional_meta.milestones && this.state.activeLowering.lowering_additional_meta.milestones.lowering_holding_50m) ? moment.utc(this.state.activeLowering.lowering_additional_meta.milestones.lowering_holding_50m) : null;
      let loweringStopTime = moment.utc(this.state.activeLowering.stop_ts);
      let loweringAbortedTime = (this.state.activeLowering.lowering_additional_meta.milestones && this.state.activeLowering.lowering_additional_meta.milestones.lowering_aborted) ? moment.utc(this.state.activeLowering.lowering_additional_meta.milestones.lowering_aborted) : null;

      let deck2DeckDurationValue = (loweringOffDeckTime) ? loweringStopTime.diff(loweringOffDeckTime) : null;
      let deploymentDuration = (loweringOffDeckTime && loweringDescendingTime) ? loweringDescendingTime.diff(loweringOffDeckTime) : null;
      let decentDurationValue = (loweringOnBottomTime && loweringDescendingTime) ? loweringOnBottomTime.diff(loweringDescendingTime) : null;
      let onBottomDurationValue = (loweringOnBottomTime && loweringOffBottomTime) ? loweringOffBottomTime.diff(loweringOnBottomTime) : null;
      let ascentDurationValue = (loweringOffBottomTime && loweringOnSurfaceTime) ? loweringOnSurfaceTime.diff(loweringOffBottomTime) : null;
      let recoveryDurationValue = (loweringStopTime && loweringOnSurfaceTime) ? loweringStopTime.diff(loweringOnSurfaceTime) : null;

      let loweringDescription = (this.state.activeLowering.lowering_additional_meta.lowering_description)? <p className="text-justify"><strong>Description:</strong> {this.state.activeLowering.lowering_additional_meta.lowering_description}</p> : null;
      let loweringLocation = (this.state.activeLowering.lowering_location) ? <span><strong>Location:</strong> {this.state.activeLowering.lowering_location}<br/></span> : null;
      let loweringPilot = (this.state.activeLowering.lowering_additional_meta.pilot)? <span><strong>Pilot:</strong> {this.state.activeLowering.lowering_additional_meta.pilot}<br/></span> : null;
      let loweringPassengers = (this.state.activeLowering.lowering_additional_meta.lowering_passengers)? <span><strong>Passengers:</strong> {this.state.activeLowering.lowering_additional_meta.lowering_passengers.join(', ')}<br/></span> : null;
      let loweringStarted = <span><strong>Started:</strong> {loweringStartTime.format("YYYY-MM-DD HH:mm")}<br/></span>;
      let loweringDeck2DeckDuration = (deck2DeckDurationValue) ? <span><strong>Deck-to-Deck:</strong> {moment.duration(deck2DeckDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span> : null;
      let loweringDeploymentDuration = (deploymentDuration) ? <span><strong>Deployment:</strong> {moment.duration(deploymentDuration).format("d [days] h [hours] m [minutes]")}<br/></span> : null;
      let loweringDescentDuration = (decentDurationValue) ? <span><strong>Descent:</strong> {moment.duration(decentDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span> : null;
      let loweringOnBottomDuration = (onBottomDurationValue) ? <span><strong>On Bottom:</strong> {moment.duration(onBottomDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span> : null;
      let loweringAscentDuration = (ascentDurationValue) ? <span><strong>Ascent:</strong> {moment.duration(ascentDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span> : null;
      let loweringRecoveryDuration = (ascentDurationValue) ? <span><strong>Recovery:</strong> {moment.duration(recoveryDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span> : null;
      let loweringAborted = (loweringAbortedTime) ? <span><strong>Aborted:</strong> {loweringAbortedTime.format("YYYY-MM-DD HH:mm")}<br/></span> : null;

      let loweringMaxDepth = (this.state.activeLowering.lowering_additional_meta.stats && this.state.activeLowering.lowering_additional_meta.stats.max_depth)? <span><strong>Max Depth:</strong> {this.state.activeLowering.lowering_additional_meta.stats.max_depth}<br/></span>: null;
      let loweringBoundingBox = (this.state.activeLowering.lowering_additional_meta.stats && this.state.activeLowering.lowering_additional_meta.stats.bounding_box)? <span><strong>BBox:</strong> {this.state.activeLowering.lowering_additional_meta.stats.bounding_box.join(', ')}<br/></span>: null;

      let loweringFiles = (this.state.activeLowering.lowering_additional_meta.lowering_files && this.state.activeLowering.lowering_additional_meta.lowering_files.length > 0)? <div><strong>Files:</strong>{this.renderLoweringFiles(this.state.activeLowering.lowering_additional_meta.lowering_files)}</div>: null;

      return (          
        <Card className="border-secondary" key={`lowering_card`}>
          <Card.Header>Lowering: <span className="text-warning">{this.state.activeLowering.lowering_id}</span><span className="float-right"><CopyLoweringToClipboard lowering={this.state.activeLowering}/></span></Card.Header>
          <Card.Body>
            {loweringDescription}
            {loweringLocation}
            {loweringPilot}
            {loweringPassengers}
            {loweringStarted}
            {loweringDeck2DeckDuration}
            {loweringDeploymentDuration}
            {loweringDescentDuration}
            {loweringOnBottomDuration}
            {loweringAscentDuration}
            {loweringRecoveryDuration}
            {loweringAborted}
            {loweringMaxDepth}
            {loweringBoundingBox}
            {loweringFiles}
            <br/>
            <Row className="px-1 justify-content-center">
              <Button className="mb-1 mr-1" size="sm" variant="outline-primary" onClick={ () => this.handleLoweringSelectForReplay() }>Replay</Button>
              <Button className="mb-1 mr-1" size="sm" variant="outline-primary" onClick={ () => this.handleLoweringSelectForReview() }>Review</Button>
              <Button className="mb-1 mr-1" size="sm" variant="outline-primary" onClick={ () => this.handleLoweringSelectForMap() }>Map</Button>
              <Button className="mb-1 mr-1" size="sm" variant="outline-primary" onClick={ () => this.handleLoweringSelectForGallery() }>Gallery</Button>
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

      let cruiseFiles = (this.state.activeCruise.cruise_additional_meta.cruise_files && this.state.activeCruise.cruise_additional_meta.cruise_files.length > 0)? <div><strong>Files:</strong>{this.renderCruiseFiles(this.state.activeCruise.cruise_additional_meta.cruise_files)}</div>: null;

      let cruiseName = (this.state.activeCruise.cruise_additional_meta.cruise_name)? <span><strong>Cruise Name:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_name}<br/></span> : null;
      let cruiseDescription = (this.state.activeCruise.cruise_additional_meta.cruise_description)? <p className="text-justify"><strong>Description:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_description}<br/></p> : null;
      let cruiseVessel = <span><strong>Vessel:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_vessel}<br/></span>;
      let cruiseLocation = (this.state.activeCruise.cruise_location)? <span><strong>Location:</strong> {this.state.activeCruise.cruise_location}<br/></span> : null;
      let cruisePorts = (this.state.activeCruise.cruise_additional_meta.cruise_departure_location)? <span><strong>Ports:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_departure_location} <FontAwesomeIcon icon='arrow-right' fixedWidth /> {this.state.activeCruise.cruise_additional_meta.cruise_arrival_location}<br/></span> : null;
      let cruiseDates = <span><strong>Dates:</strong> {cruiseStartTime.format("YYYY/MM/DD")} <FontAwesomeIcon icon='arrow-right' fixedWidth /> {cruiseStopTime.format("YYYY/MM/DD")}<br/></span>;
      let cruisePi = <span><strong>Chief Scientist:</strong> {this.state.activeCruise.cruise_additional_meta.cruise_pi}<br/></span>;
      let cruiseLowerings = this.props.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(cruiseStartTime, cruiseStopTime));
      // let cruiseLinkToR2R = (this.state.activeCruise.cruise_additional_meta.cruise_linkToR2R)? <span><strong>R2R Cruise Link :</strong> <a href={`${this.state.activeCruise.cruise_additional_meta.cruise_linkToR2R}`} target="_blank"><FontAwesomeIcon icon='link' fixedWidth/></a><br/></span> : null

      let cruiseDuration = <span><strong>Duration:</strong> {moment.duration(cruiseDurationValue).format("d [days] h [hours] m [minutes]")}<br/></span>;

      let lowerings = (cruiseLowerings.length > 0)?
        cruiseLowerings.map((lowering) => {
          if(this.state.activeLowering && lowering.id === this.state.activeLowering.id) {
            return (<div key={`select_${lowering.id}`} className="text-warning ml-2">{lowering.lowering_id}</div>);
          }

          return (<div key={`select_${lowering.id}`} className={(this.state.activeLowering && lowering.id === this.state.activeLowering.id) ? "text-warning ml-2" : "text-primary ml-2"} onClick={ () => this.handleLoweringSelect(lowering.id) }>{lowering.lowering_id}</div>);
        })
      : null;

      return (          
        <Card className="border-secondary" key={`cruise_${this.state.activeCruise.cruise_id}`}>
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
                  <strong>Lowerings:</strong>
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
      let endOfCruise = new Date(this.state.activeCruise.stop_ts);

      const cruiseLoweringsTemp = this.props.lowerings.filter(lowering => moment.utc(lowering.start_ts).isBetween(moment.utc(startOfCruise), moment.utc(endOfCruise)))
      const cruiseLowerings = cruiseLoweringsTemp.map((lowering) => { return { id: lowering.id, lowering_id: lowering.lowering_id, start_ts: lowering.start_ts, stop_ts: lowering.stop_ts } } );

      this.setState({ cruiseLowerings });
    }
}

  renderYearListItems() {

    const yearCards = []

    if (this.state.yearCruises) {
      Object.entries(this.state.yearCruises).forEach(([year,cruises])=>{
        // console.log(`${year}:${cruises.join(", ")}`)

        let yearTxt = <span className={(year == this.state.activeYear || this.state.years.size == 1) ? "text-warning" : "text-primary"}>{year}</span> 

        let yearCruises = (
            cruises.map((cruise) => {
              return (<div key={`select_${cruise.id}`} className={(this.state.activeCruise && cruise.id === this.state.activeCruise.id) ? "ml-2 text-warning" : "ml-2 text-primary"} onClick={ () => this.handleCruiseSelect(cruise.id) }>{cruise.cruise_id}</div>);
            })
        );

        if (this.state.years.size > 1) {
          yearCards.unshift(
            <Card className="border-secondary" key={`year_${year}`} >
              <Accordion.Toggle as={Card.Header} eventKey={year}>
                <h6>Year: {yearTxt}</h6>
              </Accordion.Toggle>
              <Accordion.Collapse eventKey={year}>
                <Card.Body className="py-2">
                  {yearCruises}
                </Card.Body>
              </Accordion.Collapse>
            </Card>
          );
        }
        else {
          yearCards.push(
            <Card className="border-secondary" key={`year_${year}`} >
              <Card.Header>Year: {yearTxt}</Card.Header>
              <Card.Body className="py-2">
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
      let cruiseDescription = (cruise.cruise_additional_meta.cruise_description)? <p className="text-justify"><strong>Description:</strong> {cruise.cruise_additional_meta.cruise_description}</p> : null;
      let cruiseLocation = (cruise.cruise_location)? <span><strong>Location:</strong> {cruise.cruise_location}<br/></span> : null;
      let cruiseDates = <span><strong>Dates:</strong> {moment.utc(cruise.start_ts).format("YYYY/MM/DD")} - {moment.utc(cruise.stop_ts).format("YYYY/MM/DD")}<br/></span>;
      let cruisePI = <span><strong>Chief Scientist:</strong> {cruise.cruise_additional_meta.cruise_pi}<br/></span>;
      let cruiseVessel = <span><strong>Vessel:</strong> {cruise.cruise_additional_meta.cruise_vessel}<br/></span>;
      let cruiseFiles = (cruise.cruise_additional_meta.cruise_files && cruise.cruise_additional_meta.cruise_files.length > 0)? <span><strong>Files:</strong><br/>{this.renderCruiseFiles(cruise.cruise_additional_meta.cruise_files)}</span>: null;
      
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
        <Card className="border-secondary" key={cruise.id} >
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
        <Accordion className="border-secondary" id="accordion-controlled-year" activeKey={this.state.activeYear} onSelect={this.handleYearSelect}>
          {this.renderYearListItems()}
        </Accordion>
      );
    } else if(this.state.years && this.state.years.size > 0) {
      return (
        this.renderYearListItems()
      )
    }

    return (
      <Card className="border-secondary" >
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
      <Card className="border-secondary" >
        <Card.Body>No cruises found!</Card.Body>
      </Card>
    );
  }


  render(){
    return (
      <div>
        <Row>
            <h4>Welcome to Sealog</h4>
            <p className="text-justify">{MAIN_SCREEN_TXT}</p>
        </Row>
        <Row className="mt-2">
          <Col className="px-1" sm={3} md={3} lg={2}>
            {this.renderYearList()}
          </Col>
          <Col className="px-1" sm={4} md={4} lg={5}>
            {this.renderCruiseCard()}
          </Col>
          <Col className="px-1" sm={5} md={5} lg={5}>
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
