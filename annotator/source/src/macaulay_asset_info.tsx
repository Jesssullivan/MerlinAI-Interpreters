const React = require('react');

/**
 * Renders the image information that will show up under the Map
 * Stuff like image id, attribution, etc.
 */
export class MLAudioInfo extends React.Component {

    constructor(props: null) {
        super(props);
    }

    render(){

        const locationDateFields = [];
        if('countryName' in this.props.image){
            locationDateFields.push((
                <div className="col" key='countryName'>
                    <span> Country: {this.props.image.countryName} </span>
                </div>
            ));
        }

        if ('subnational1Code' in this.props.image){
            locationDateFields.push((
                <div className="col" key='subnational1Code'>
                    <span> State: {this.props.image.subnational1Code} </span>
                </div>
            ));
        }

        if('obsYear' in this.props.image && 'obsMonth' in this.props.image && 'obsDay' in this.props.image){
            locationDateFields.push((
                <div className="col" key='date'>
                    <span> Date: {"" + this.props.image.obsMonth + "-" + this.props.image.obsDay + "-" + this.props.image.obsYear} </span>
                </div>
            ));
        }

        let commentsEl;
        if('comments' in this.props.image){
            commentsEl = (
                <div className="row">
                    <div className="col">
                        <span> Comments: {this.props.image.comments} </span>
                    </div>
                </div>
            );
        }
        else{
            commentsEl = "";
        }

        let backgroundSpeciesEl;
        if('backgroundSubjectData' in this.props.image){
            backgroundSpeciesEl = (
                <div className="row">
                    <div className="col">
                        <span> Background Subjects: {this.props.image.backgroundSubjectData} </span>
                    </div>
                </div>
            );
        }
        else{
            backgroundSpeciesEl = "";
        }

        return (
            <div>
                <div className="row">
                    <div className="col">
                        <a href={this.props.image.url} target="_blank">View Full Spectrogram</a>
                    </div>
                    <div className="col">
                        <span> Attribution: {this.props.image.attribution}</span>
                    </div>
                    { this.props.image.src != null  && <div className="col"><a href={this.props.image.src} target="_blank">ML {this.props.image.id}</a></div> }
                </div>
                <div className="row">
                    {locationDateFields}
                </div>
                {commentsEl}
                {backgroundSpeciesEl}
            </div>

        );
    }
}
