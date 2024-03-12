from flask import Flask, jsonify, request
from flask_cors import CORS
import cv2
from screeninfo import get_monitors, Monitor


class Port:
    def __init__(self, name, port, width, height, framerate) -> None:
        self.name: name
        self.port: port
        self.width: width
        self.height: height
        self.framerate: framerate


class OutputPort:
    name: str
    port: str
    resolution: str
    width: int
    height: int
    framerate: float or int


# Source interface that can be read from
# Output interface that can be written to

app = Flask(__name__)
CORS(app)

# Sample data
inputs = [
    Port("HDMI 1(CamLink Pro)", "HDMI-IN 1", "1920", "1080", "60"),
    Port("HDMI 2(CamLink Pro)", "HDMI-IN 2", "1920", "1080", "60"),
    Port("HDMI 3(CamLink Pro)", "HDMI-IN 3", "1920", "1080", "60"),
    Port("HDMI 4(CamLink Pro)", "HDMI-IN 4", "1920", "1080", "60"),
]
outputs = [
    Port("HDMI 1(RTX 3060 Ti)", "HDMI-OUT 1", "1920", "1080", "60"),
    Port("HDMI 2(RTX 3060 Ti)", "HDMI-OUT 2", "1920", "1080", "60"),
    Port("HDMI 3(RTX 3060 Ti)", "HDMI-OUT 3", "1920", "1080", "60"),
    Port("HDMI 4(RTX 3060 Ti)", "HDMI-OUT 4", "1920", "1080", "60"),
]
layout = {"items": ["Item 1", "Item 2", "Item 3"]}


@app.route("/inputs", methods=["GET"])
def get_inputs():
    i = 0
    cameras = []
    while i < 32:
        print(f"Getting video capture {i}...")
        cap = cv2.VideoCapture(i)
        # print(cv2.VideoCapture)
        # print(cap.read())
        # print(cap.read()[0])
        # print("cap: ", cap, cap.isOpened())
        if cap.read()[0]:
            cameras.append(i)
            print(f"Found capture {cap.getBackendName()}")
        else:
            break
        cap.release()
        i += 1
        # Break if no capture data
    return jsonify(cameras)


@app.route("/outputs", methods=["GET"])
def get_outputs():
    return jsonify(get_monitors())
    # print(outputs)
    # print([port.__dict__ for port in outputs])
    # return jsonify(outputs)
    # return jsonify([output.__dict__ for output in outputs])


@app.route("/layouts", methods=["GET", "POST", "PATCH"])
def handle_layout():
    if request.method == "GET":
        return jsonify(layout)
    # elif request.method == 'POST':
    # This is a simple example, so we'll just replace the entire layout.
    # In a real application, you might want to validate the new layout or only change certain parts of it.
    new_layout = request.get_json()
    layout.update(new_layout)
    return jsonify(layout)


if __name__ == "__main__":
    app.run(debug=True)
