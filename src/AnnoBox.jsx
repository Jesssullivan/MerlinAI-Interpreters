const React = require("react");
import AssetButton from "../src/AssetButton"

const AnnoBox = () => {
    return (
        <div id="annotationTask">
            <script src="https://code.jquery.com/jquery-3.4.1.slim.min.js" integrity="sha384-J6qa4849blE2+poT4WnyKhv5vZF5SrPo0iEjwBvKU7imGFAV0wwj1yYfoRSJoZ+n" crossorigin="anonymous"></script>
            <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js" integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo" crossorigin="anonymous"></script>
            <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/js/bootstrap.min.js" integrity="sha384-wfSDF2E50Y2D1uUdj0O3uMBJnjuUD4Ih7YwaYd1iqfktj0Uod8GCExl3Og8ifwB6" crossorigin="anonymous"></script>
            <script src="https://unpkg.com/react@16/umd/react.development.js" crossorigin></script>
            <script src="https://unpkg.com/react-dom@16/umd/react-dom.development.js" crossorigin></script>
            <script src="../src/leaflet.annotation.js"></script>

            <div className="row justify-content-center">
                <div className="col-md-3 alert-primary">
                    <div className="row">
                        <div className="col">
                            <h4 id="currentAudioDuration"></h4>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <button id="exportAnnos" type="button" className="btn btn-primary">Export Annotations</button>
                </div>
                <div id="annotationHolder"/>
            </div>
        </div>
    )
}

export default AnnoBox;


