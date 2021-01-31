const React = require('react');

/**
 * This represents an annotation instance in the side bar next to the image.
 */
export class AnnotationInstance extends React.Component {

    constructor(props: null) {

        super(props);

        this.state = {
            list_pos : this.props.list_pos
        };

        this.onDelete = this.onDelete.bind(this);
        this.onFocus = this.onFocus.bind(this);
        this.onHideOthers = this.onHideOthers.bind(this);
        this.onClassify = this.onClassify.bind(this);
        this.onCategoryChange = this.onCategoryChange.bind(this);
        this.onSupercategoryChange = this.onSupercategoryChange.bind(this);
        this.onGroupChange = this.onGroupChange.bind(this);
        this.onAnnotateBox = this.onAnnotateBox.bind(this);
        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);

    }

    onMouseEnter = () => {
        // continue
    };

    onMouseLeave = () => {
        // continue
    };

    onDelete = () => {
        this.props.handleDelete(this.props.index);
    };

    onFocus = () => {
        this.props.handleFocus(this.props.index);
    };

    onClassify = () => {
        this.props.handleClassify(this.props.index);
    };

    onHideOthers = () => {
        this.props.handleHideOthers(this.props.index);
    };

    onCategoryChange = () => {
        this.props.handleCategoryChange(this.props.index);
    };

    onSupercategoryChange = () => {
        this.props.handleSupercategoryChange(this.props.index);
    };

    onGroupChange = (e: { target: { checked: null } }) => {
        this.props.handleGroupChange(this.props.index, e.target.checked);
    };

    onAnnotateBox = () => {
        this.props.handleAnnotateBox(this.props.index);
    };

    render = () => {

        // @ts-ignore
        let colorBadgeEl: JSX.Element;

        // Do we have a bounding box layer?
        if (this.props.hasBox){

            // Are we hidden?
            const annotation_color = this.props.badgeColor;

            if(this.props.hidden){
                colorBadgeEl = <span className="badge badge-secondary">Hidden</span>;
            }
            else{
                colorBadgeEl = <div className="btn btn-md square-badge" style={{backgroundColor: annotation_color}}></div>;
            }
        }

        // We have no box, allow the user to annotate a box for this annotation
        else {
            colorBadgeEl = (
                <button className="btn btn-sm btn-outline-danger" onClick={this.onAnnotateBox}>
                    Box N/A
                </button>
            );
        }

        // Do we show the supercategory?
        // @ts-ignore
        let supercategoryEl: JSX.Element;

        if (this.props.showSupercategory && this.props.annotation.supercategory !== 'undefined' &&  this.props.annotation.supercategory != null){

            if(this.props.allowSupercategoryEdit){
                supercategoryEl = (
                    <button className="btn btn-sm btn-outline-primary" onClick={this.onSupercategoryChange}>
                        <span className="annotation-instance-supercategory-name">{this.props.annotation.supercategory}</span>
                    </button>
                );
            }
            else {
                supercategoryEl = <span className="annotation-instance-supercategory-name">{this.props.annotation.supercategory}</span>;
            }
        }

        // Do we show the category?
        // @ts-ignore
        let categoryEl: JSX.Element;
        if( this.props.showCategory ){

            if(this.props.allowCategoryEdit){

                // var categoryName = "";
                if(this.props.category != null){
                    categoryEl = (
                        <button className="btn btn-sm btn-outline-primary" onClick={this.onCategoryChange}>
                            <span className="annotation-instance-category-name">{this.props.category.name}</span>
                        </button>
                    );
                }
                else {
                    categoryEl = (
                        <button className="btn btn-sm btn-outline-danger" onClick={this.onCategoryChange}>
                            <span className="annotation-instance-category-name">N/A</span>
                        </button>
                    );
                }

            }
            else {
                categoryEl = <span>{this.props.category.name}</span>;
            }
        }
        // Do we show classify button?
        // @ts-ignore
        let classifyEl: JSX.Element;
        if (this.props.enableClassifyCall) {
            classifyEl = <button type="button" className="btn btn-sm btn-outline-success"
                                 onClick={this.onClassify}>Classify </button>;
        }
        return (
            <div>
            <div className="card">
                <div className="card-body">
                    <br/>
                    <div className="row">
                        <div className="col-2">{ colorBadgeEl }</div>
                        <div className="col-2">{ categoryEl }</div>
                        <div className="col-3">{ supercategoryEl }</div>
                    </div>
                    <br/>
                      <div className="row">
                        <div className="btn-group" role="group">
                            <button type="button" className="btn btn-sm btn-outline-danger" onClick={this.onDelete}>Delete   </button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={this.onFocus}>Focus</button>
                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={this.onHideOthers}>Hide Others</button>
                            {classifyEl}
                        </div>
                    </div>
                </div>
            </div>
            </div>
        );

    };

}
