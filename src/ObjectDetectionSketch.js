import * as p5 from "p5";
import "p5/lib/addons/p5.dom";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";

export var currentWidth = 0;
export var currentHeight = 0;

export var facePos = {
    width: 0,
    height: 0,
    x: 0,
    y: 0,
};

export var idealPos = {
    width: undefined,
    height: undefined,
    x: undefined,
    y: undefined,
};

export var sensitivity = {
    horizontal: 0.4,
    vertical: 0.2,
};

// returns true if out of the frame!
export function checkPosition() {
    const x1 = facePos.x;
    const x2 = facePos.x + facePos.width;
    const y1 = facePos.y;
    const y2 = facePos.y + facePos.height;

    const delta_width = idealPos.width * sensitivity.horizontal;
    const delta_height = idealPos.height * sensitivity.vertical;

    const border_x1 = idealPos.x - 0.5 * delta_width;
    const border_x2 = idealPos.x + idealPos.width + delta_width;
    const border_y1 = idealPos.y - 0.5 * delta_height;
    const border_y2 = idealPos.y + idealPos.height + delta_height;

    return x1 < border_x1 || x2 > border_x2 || y1 < border_y1 || y2 > border_y2;
}

export default function sketch(p) {
    let capture = null;
    let cocossdModel = null;

    let cocoDrawings = [];
    let faceDrawings = [];

    function showCocoSSDResults(results) {
        cocoDrawings = results;
    }

    function showFaceDetectionData(data) {
        // console.log("faceDrawings ", data);
        faceDrawings = data;
    }

    p.setup = async function () {
        await faceapi.loadSsdMobilenetv1Model(MODEL_URL);
        await faceapi.loadAgeGenderModel(MODEL_URL);
        await faceapi.loadFaceExpressionModel(MODEL_URL);

        p.createCanvas(1280, 720);
        const constraints = {
            video: {
                mandatory: {
                    minWidth: 1280,
                    minHeight: 720,
                },
                optional: [{ maxFrameRate: 20 }],
            },
            audio: false,
        };

        capture = p.createCapture(constraints, () => {});

        capture.id("video_element");
        capture.size(1280, 720);
        capture.hide();

        cocoSsd
            .load()
            .then((model) => {
                try {
                    cocossdModel = model;
                } catch (e) {
                    console.log(e);
                }
            })
            .catch((e) => {
                console.log("Error occured : ", e);
            });
    };

    p.draw = async () => {
        if (!capture) {
            return;
        }
        p.background(255);
        p.image(capture, 0, 0);
        p.fill(0, 0, 0, 0);

        cocoDrawings.map((drawing) => {
            if (
                drawing &
                ((drawing.score > 0.7) & (drawing.class == "person"))
            ) {
                p.textSize(20);
                p.strokeWeight(1);
                const textX = drawing.bbox[0] + drawing.bbox[2];
                const textY = drawing.bbox[1] + drawing.bbox[3];

                const confidenetext = "Confidence: " + drawing.score.toFixed(1);

                if ((drawing.score > 0.7) & (drawing.class == "person")) {
                    const textWidth = p.textWidth(confidenetext);

                    const itemTextWidth = p.textWidth(drawing.class);
                    p.text(
                        drawing.class,
                        textX - itemTextWidth - 10,
                        textY - 50
                    );

                    p.text(confidenetext, textX - textWidth - 10, textY - 10);
                    p.strokeWeight(4);
                    p.stroke("rgb(0%,0%,100%)");
                    p.rect(
                        drawing.bbox[0],
                        drawing.bbox[1],
                        drawing.bbox[2],
                        drawing.bbox[3]
                    );
                }
            }
        });

        faceDrawings.map((drawing) => {
            if (drawing) {
                p.textSize(15);
                p.strokeWeight(1);

                const textX =
                    drawing.detection.box._x + drawing.detection.box._width;
                const textY =
                    drawing.detection.box._y + drawing.detection.box._height;

                // const confidencetext = "Gender: " + drawing.gender;
                // const textWidth = p.textWidth(confidencetext);
                // p.text(confidencetext, textX - textWidth - 10, textY - 60);

                // const agetext = "Age: " + drawing.age.toFixed(0);
                // const ageTextWidth = p.textWidth(agetext);
                // p.text(agetext, textX - ageTextWidth - 10, textY - 30);

                const copiedExpression = drawing.expressions;
                const expressions = Object.keys(copiedExpression).map((key) => {
                    const value = copiedExpression[key];
                    return value;
                });

                const max = Math.max(...expressions);

                const expression_value = Object.keys(copiedExpression).filter(
                    (key) => {
                        return copiedExpression[key] === max;
                    }
                )[0];

                const expressiontext = "Mood: " + expression_value;
                const expressionWidth = p.textWidth(expressiontext);
                // p.text(
                //     expressiontext,
                //     textX - expressionWidth - 10,
                //     textY - 10
                // );

                const box = drawing.detection.box;
                facePos.width = box._width;
                facePos.height = box.height;
                facePos.x = box._x;
                facePos.y = box._y;

                const colorString = checkPosition()
                    ? "rgb(100%, 0%, 0%)"
                    : "rgb(0%,100%,10%)";

                p.strokeWeight(4);
                p.stroke(colorString);
                p.rect(
                    drawing.detection.box._x,
                    drawing.detection.box._y,
                    drawing.detection.box._width,
                    drawing.detection.box._height
                );

                p.strokeWeight(8);
                p.stroke("rgb(0%, 100%, 100%");

                const delta_width = idealPos.width * sensitivity.horizontal;
                const delta_height = idealPos.height * sensitivity.horizontal;
                p.rect(
                    idealPos.x - delta_width / 2,
                    idealPos.y - delta_height / 2,
                    idealPos.width + delta_width,
                    idealPos.height + delta_height
                );

                // console.log(
                //     "width: ",
                //     drawing.detection.box._width,
                //     ", height: ",
                //     drawing.detection.box._height
                // );

                // currentWidth = drawing.detection.box._width;
                // currentHeight = drawing.detection.box._height;
            }
        });

        faceapi
            .detectAllFaces(capture.id())
            .withAgeAndGender()
            .withFaceExpressions()
            .then((data) => {
                showFaceDetectionData(data);
            });

        // if (capture.loadedmetadata) {
        //     if (cocossdModel) {
        //         cocossdModel
        //             .detect(document.getElementById("video_element"))
        //             .then(showCocoSSDResults)
        //             .catch((e) => {
        //                 console.log("Exception : ", e);
        //             });
        //     }
        // }
    };
}
