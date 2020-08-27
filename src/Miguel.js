import React, { useState, useEffect } from 'react';
import './style/App.css';


export default function ViewTime(props) {
 const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        fetch('/time').then(res => res.json()).then(data => {
            setCurrentTime(data.time);
        });
    }, []);

    return (
        <div className="App">
            <div className="App-header">
                <p>The current time is {currentTime}.</p>
            </div>
        </div>
    );
}
