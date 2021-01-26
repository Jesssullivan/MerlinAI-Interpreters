const React = require('react');

/**
 * Renders the image information that will show up under the Map
 * Stuff like image id, attribution, etc.
 */
export class ImageInfo extends React.Component{

    constructor(props: null) {
        super(props);
    }

    render() {
        return (
            <div className="row">
                <div className="col">
                    <a href={this.props.image.url} target="_blank">Image ID: {this.props.image.id}</a>
                </div>
                <div className="col">
                    <span> Attribution: {this.props.image.attribution}</span>
                </div>
                { this.props.image.src != null  && <div className="col"><a href={this.props.image.src} target="_blank">Source</a></div> }
            </div>
        );
    }
}
