import React from "react";
import "./App.css";
import objectDetectionSketch, { checkPosition } from "./ObjectDetectionSketch";

import { facePos, idealPos } from "./ObjectDetectionSketch";

import P5Wrapper from "react-p5-wrapper";

import Handlebars from "handlebars";

function getDims() {
    console.log("idealPos: ", idealPos);
}

export default class app extends React.Component {
    state = {
        paused: false,
        timeLapsed: 0,
    };

    componentDidMount() {
        setInterval(() => {
            // update the timer
            if (
                (idealPos.width !== undefined) &
                (idealPos.width > 0) &
                !this.state.paused
            ) {
                this.setState({ timeLapsed: this.state.timeLapsed + 1 });

                console.log("time lapsed: ", this.state.timeLapsed);
            }
        }, 1000);
        setInterval(() => {
            var diff_width = facePos.width - idealPos.width;
            var diff_height = facePos.height - idealPos.height;
            var diff_x = Math.abs(facePos.x - idealPos.x);
            var diff_y = Math.abs(facePos.y - idealPos.y);

            if (!this.state.paused & checkPosition()) {
                var audio = new Audio("dland_hint.wav");
                audio.volume = Math.min(
                    0.4,
                    Math.max(
                        diff_width / idealPos.width,
                        diff_height / idealPos.height,
                        diff_x / idealPos.x,
                        diff_y / idealPos.y
                    )
                );
                audio.play();
            }
        }, 50);
    }

    handleResetSession = () => {
        window.location.reload();
    };

    handleRecordDims = () => {
        alert("New upright position is set! 🙌  Time to go to work 🧑‍💻");
        var audio = new Audio("recording-start.mp3");
        audio.play();
        this.setState({
            timeLapsed: 0,
        });

        idealPos.width = facePos.width;
        idealPos.height = facePos.height;
        idealPos.x = facePos.x;
        idealPos.y = facePos.y;
    };

    handlePause = () => {
        this.setState({ paused: !this.state.paused });
    };
    render() {
        return (
            <div className="App">
                <h1>Slouch Again!</h1>
                <p>
                    {idealPos.width
                        ? "Don't go too far outside the white box - you've been warned ⛔️ ." +
                          " If you want, you can hit Pause and take a break."
                        : "Welcome! Sit up straight in a comfortable way that you want, and then setup your upright position to start monitoring your posture. Slouch again if you can 😏"}
                </p>
                <p id="timer-txt">
                    Time lapsed:{" "}
                    {new Date(this.state.timeLapsed * 1000)
                        .toISOString()
                        .substr(11, 8)}
                </p>
                <button onClick={this.handleRecordDims}>
                    Set a new upright position
                </button>
                <button id="pause-button" onClick={this.handlePause}>
                    {this.state.paused ? "Unpause" : "Pause"}
                </button>
                <button onClick={this.handleResetSession}>Reset</button>
                <div className="flip-horizontal">
                    {" "}
                    <P5Wrapper
                        sketch={objectDetectionSketch}
                        getDims={getDims}
                    />
                </div>
            </div>
        );
    }
}
