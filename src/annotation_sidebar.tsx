const React = require('react');

/**
 * This is the side bar that renders the collection of annotations for the image.
 *
 */
export class AnnotationSidebar extends React.Component {

    constructor(props: null) {
        super(props);
    }

    render(){
        return(
            <div className="annotation-sidebar">
                <div className="row justify-content-between annotation-sidebar-top">
                    <div className="col-auto" >
                        <button type="button" className="btn btn-outline-primary" onClick={this.props.onCreateNewInstance}>+</button>
                    </div>
                    <div className="col-auto">
                        <div className='btn'>{"" + this.props.children.length + " Objects"}</div>
                      </div>
                    <div className="col-auto">
                        <div className="btn-group" role="group">
                            <button type="button" className="btn btn-outline-secondary" onClick={this.props.onHideAllAnnotations}>Hide All</button>
                            <button type="button" className="btn btn-outline-secondary" onClick={this.props.onShowAllAnnotations}>Show All</button>
                        </div>
                    </div>
                </div>
                <div className="row annotation-sidebar-annotation-instances">
                  <div className="col">
                    {this.props.children}
                  </div>
                </div>
            </div>
        );
    }
}
