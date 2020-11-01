import React from 'react';

/**
 * This renders a modal for category selection. This is not the
 * smartest implementation especially if there is a large number of classes.
 */
export class CategorySelection extends React.Component {

    constructor(props) {
        super(props);

        // want to add an index to the categories
        var data = [];
        var defaultFilteredData = [];
        let quickAccessCategoryIDs = this.props.quickAccessCategoryIDs || [];
        for(var i=0; i < this.props.categories.length; i++){
            var cat = Object.assign({}, this.props.categories[i]);
            cat.idx = i;
            data.push(cat);

            if(quickAccessCategoryIDs.includes(cat.id)){
                defaultFilteredData.push(cat);
            }
        }

        // We want to sort defaultFilteredData to have the same order as quickAccessCategoryIDs
        if (quickAccessCategoryIDs.length > 0){
            defaultFilteredData.sort(function(a, b){
                let indxA = quickAccessCategoryIDs.indexOf(a.id);
                let indxB = quickAccessCategoryIDs.indexOf(b.id);
                return indxA - indxB
            });
        }
        this.defaultFilteredData = defaultFilteredData;

        this.state = {
            data: data,
            filteredData : data,
            lastKey : null
        };

        this.onCancel = this.onCancel.bind(this);
        this.onSelect = this.onSelect.bind(this);
        this.onSelectNone = this.onSelectNone.bind(this);

        this.filterData = this.filterData.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    componentDidMount(){
        this.filterInput.focus();
    }

    componentWillUnmount(){

    }

    componentDidUpdate(prevProps, prevState, snapshot){

    }

    onCancel(){
        this.props.onCancel();
    }

    onSelect(e){
        let idx = parseInt(e.target.dataset.idx);
        this.props.onSelect(idx);
    }

    onSelectNone(){
        this.props.onSelectNone();
    }

    filterData(e){
        e.preventDefault();
        let regex = new RegExp(e.target.value, 'i');
        let filtered = this.state.data.filter((category) => {
          return category.name.search(regex) > -1;
        }).sort((a, b) =>{
            if (a.name.toLowerCase() == e.target.value){
                return -1;
            }
            else if(b.name.toLowerCase() == e.target.value){
                return 1;
            }
            return a.name.localeCompare(b.name);
        });
        this.setState({
          filteredData : filtered
        });
    }

    onKeyDown(e){
        if (e.key === 'Enter'){
            this.setState({
                lastKey : e.key
            })
        }
        else{
            if (this.state.lastKey === 'Enter'){
                this.setState({
                    lastKey : e.key
                })
            }
        }
    }

    render(){

        let filteredCategories = this.state.filteredData;
        var categoryEls = [];
        if (this.state.lastKey === 'Enter'){
            for(var i = 0; i < filteredCategories.length; i++){
                let cat = filteredCategories[i];
                categoryEls.push((
                    <li className="list-group-item" key={cat.idx}>
                        <button data-idx={cat.idx} type="button" className="btn btn-outline-primary" onClick={this.onSelect}>{cat.name}</button>
                    </li>
                ));
            }
        }

        else{

            if (this.defaultFilteredData.length > 0){
                for(var i = 0; i < this.defaultFilteredData.length; i++){
                    let cat = this.defaultFilteredData[i];
                    categoryEls.push((
                        <li className="list-group-item" key={cat.idx}>
                            <button data-idx={cat.idx} type="button" className="btn btn-outline-primary" onClick={this.onSelect}>{cat.name}</button>
                        </li>
                    ));
                }
            }
            else{
                // Show the top X?
                let lim = Math.min(filteredCategories.length, 20);
                for(var i = 0; i < lim; i++){
                    let cat = filteredCategories[i];
                    categoryEls.push((
                        <li className="list-group-item" key={cat.idx}>
                            <button data-idx={cat.idx} type="button" className="btn btn-outline-primary" onClick={this.onSelect}>{cat.name}</button>
                        </li>
                    ));
                }
            }
        }

        var selectNoneEl = "";
        if (this.props.allowSelectNone){
            selectNoneEl = (
                <div className="col-4">
                    <button type="button" className="btn btn-outline-primary" onClick={this.onSelectNone}>Select None</button>
                </div>
            );
        }

        return (
            <div>
                <div className="row justify-content-between">
                    <div className="col-2">
                        <button type="button" className="btn btn-outline-primary" onClick={this.onCancel}>Cancel</button>
                    </div>
                    {selectNoneEl}
                </div>
                <div className="row">
                    <div className="col">
                        <span>Choose a <strong>{this.props.categoryType}</strong></span>
                    </div>
                </div>
                <div className="row">
                    <div className="col">
                        <div className="form-group">
                            <label></label>
                            <input ref={(input) => {this.filterInput = input;}} type='text' className="form-control" onChange={this.filterData} onKeyDown={this.onKeyDown}></input>
                            <small className="form-text text-muted">Type the category name, press enter, then choose from the list.</small>
                            { categoryEls.length > 0 && <ul className="list-group category-selection-filter-results">{categoryEls}</ul> }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

}

// Previous instruction hint: Type the category name then choose from the list. Press enter to force all matching results to show, otherwise only a subset will show.
// Changing it to: