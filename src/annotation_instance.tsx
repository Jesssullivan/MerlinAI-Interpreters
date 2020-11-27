const React = require('react');

/**
 * This represents an annotation instance in the side bar next to the image.
 */
export class AnnotationInstance extends React.Component {

    constructor(props: any) {

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
        this.onEditSegment = this.onEditSegment.bind(this);
        this.onDeleteSegment = this.onDeleteSegment.bind(this);

        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);

    }

    onMouseEnter() {
        // continue
    }

    onMouseLeave() {
        // continue
    }

    onDelete() {
        this.props.handleDelete(this.props.index);
    }

    onFocus() {
        this.props.handleFocus(this.props.index);
    }

    onClassify() {
        this.props.handleClassify(this.props.index);
    }

    onHideOthers() {
        this.props.handleHideOthers(this.props.index);
    }

    onCategoryChange() {
        this.props.handleCategoryChange(this.props.index);
    }

    onSupercategoryChange() {
        this.props.handleSupercategoryChange(this.props.index);
    }

    onGroupChange(e: any) {
        this.props.handleGroupChange(this.props.index, e.target.checked);
    }

    onAnnotateBox(){
        this.props.handleAnnotateBox(this.props.index);
    }

    onEditSegment(){
        this.props.handleEditSegment(this.props.index);
    }

    onDeleteSegment(){
        this.props.handleDeleteSegment(this.props.index);
    }

    render(){

        // let collapseID =  "AnnotationCollapse" + this.props.annotation.image_id + this.props.index;
        // let collapseID = "AnnotationCollapse" + ~~(Math.random() * 1000000)
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

        // Do we show category tags?
        // var category_tags = "";

        // Do we show the group / crowd checkbox?
        let groupEl: JSX.Element;
        if (this.props.showGroupOption) {

            const isGroup = this.props.annotation.iscrowd === true;
            groupEl = (
                <div>
                    <div className="dropdown-divider"></div>
                    <form className="px-4 py-3">
                        <div className="form-check">
                            <div className="row"><input type="checkbox" className="form-check-input" checked={isGroup} onChange={this.onGroupChange} /></div>
                            <div className="row"><label className="form-check-label"> Is Group? </label></div>
                        </div>
                    </form>
                </div>
            );

        }

        // Do we allow segmentation?
        let segmentationEl: JSX.Element;
        if (this.props.showSegmentationOption){
            segmentationEl = (

                <div>
                    <div className="row">
                        <div className="btn-group" role="group">
                            <button type="button" className="btn btn-outline-danger btn-sm" onClick={this.onDeleteSegment}>Delete Segmentation</button>
                            <button type="button" className="btn btn-outline-primary btn-sm" onClick={this.onEditSegment}>Edit Segmentation</button>
                        </div>
                    </div>
                </div>
            );
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
                            <button type="button" className="btn btn-sm btn-outline-success" onClick={this.onClassify}>Classify</button>
                        </div>
                    </div>
                    <div className="row">
                        {groupEl}
                    </div>
                    <div className="row">
                        Segmentation:
                    </div>
                    <div>
                        {segmentationEl}
                    </div>
                </div>
            </div>
            </div>
        );

    }

  }
