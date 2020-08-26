import React, { Component } from 'react'
import AssetButton from "../demos/AssetButton";

// todo: get canvas & mainSection HTML Elements working down here, or come up with a better idea

export default class CropBox extends Component {
    render() {
        return (
           //  React.Fragment (and `next/Head` elements) must be adjacent to tag-passing classes
        <React.Fragment>
            {/*
            Apparently you can style jsx this way... hmm
            component level & global css (via _app.js) definitely do not
            :-t
            probably a better idea to just reimplement these from jsx,
                ...still poking stuff to figuring the existing bits out
            */}
            <style jsx>{`
                 #specContainer{
                    width: 100%;
                }
                
                #specImageHolder{
                     overflow-x: auto;
                }
                
                button svg{
                    transform:translateY(-.05rem);
                    fill:#000;
                    width:1.4rem
                }
                button:active svg{
                    transform:translateY(0)
                }
                button:disabled svg{
                    fill:#9a9a9a
                }
                #recordButton:disabled svg{fill:#e50000}
                `}</style>

            <div id="specImageHolder"/>
            <canvas className="visualizer" height="60px"/>
            <title>Crop Box Test</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
                <link rel="stylesheet"
                              href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css"
                              integrity="sha384-9aIt2nRpC12Uk9gS9baDl411NQApFmC26EwAOH8WgZl5MYYxFfc+NcPb1dKGj7Sk"
                              crossOrigin="anonymous">
                </link>
                <link rel="stylesheet" href="../demos/nouislider.css"/>

                <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"
                        integrity="sha384-DfXdz2htPH0lsSSs5nCTpuj/zy4C+OGpamoFVy38MVBnE+IbbVYUew+OrCXaRkfj"
                        crossOrigin="anonymous">
                </script>
                <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.0/dist/umd/popper.min.js"
                        integrity="sha384-Q6E9RHvbIyZFJoft+2mJbHaEWldlvI9IOYy5n3zV9zzTtmI3UksdQRVvoxMfooAo"
                        crossOrigin="anonymous">
                </script>
                <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"
                        integrity="sha384-OgVRvuATP1z7JjHLkuOU7Xw704+h835Lr+6QL9UvYjZE3Ipu6Tp75j7Bh/kR0JKI"
                        crossOrigin="anonymous">
                </script>

                <li>
                    <h3> Record: </h3>
                    <AssetButton asset="PlayPause.svg"  id="recordButton" hintTrueString=" ...Recording!"/>
                </li>
                <li>
                    <h3> Stop: </h3>
                    <AssetButton asset="PlayPause.svg" id="stopButton" hintTrueString=" ...Stopped!"/>
                </li>
                <div id="specImageHolder"/>
                <div id="specSliderHolder"/>
                <div id="specAnalyzeButtonHolder"/>
                <div id="specCropHolder"/>
                <script src="../demos/spec_record_crop_bundle.js"/>
            </React.Fragment>
        )
    }
}
