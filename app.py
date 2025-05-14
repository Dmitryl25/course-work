from flask import Flask, render_template, request, jsonify
from ontology import load_and_process_owl, generate_evaluation_scales
from flask import Response
import json
import os
import subprocess
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

owl_file_path = r'C:\Data\cinema.owl'
@app.route("/load-scales", methods=["GET"])
def load_scales():
    g, criteria = load_and_process_owl(owl_file_path)
    scales = generate_evaluation_scales(criteria, g)
    formatted_scales = {prop: details['details']['values'] for prop, details in scales.items() if details['type'] == 'Качественный'}
    return jsonify(formatted_scales)


@app.route("/load-quantitative-scales", methods=["GET"])
def load_quantitative_scales():
    g, criteria = load_and_process_owl(owl_file_path)
    scales = generate_evaluation_scales(criteria, g)
    quantitative_scales = {
        prop: {
            'min': details['details'].get('minInclusive', 'Не указано'),
            'max': details['details'].get('maxInclusive', 'Не указано')
        }
        for prop, details in scales.items() if details['type'] == 'Количественный'
    }
    return jsonify(quantitative_scales)


def send_file_to_api(data):
    input_path = "C:/Users/dimul/Desktop/Inter/input.json"
    output_dir = "C:/Users/dimul/Desktop/Inter/"
    jar_path = "C:/Users/dimul/Desktop/Inter/lingvo-dss-all.jar"
    os.makedirs((os.path.dirname(input_path)), exist_ok=True)
    try:
        with open(input_path, "w", encoding="UTF-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        return jsonify({"error": f"Failed to write JSON file {e}"})
    if not os.path.isfile(jar_path):
        return jsonify({"error": "No jar"})
    com = ["java", "-jar", jar_path, "-i", "C:/Users/dimul/Desktop/Inter/data.json", "-o", output_dir]
    try:
        result = subprocess.run(com, capture_output=True, text=True, check=True)
        return jsonify({
            "status": "success",
            "stdout": result.stdout,
            "stderr": result.stderr
        })
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": "Decision Maker execution failed",
            "stdout": e.stdout,
            "stderr": e.stderr
        }), 500

@app.route('/')
def index():
    return render_template("page.html")
@app.route("/get_file", methods=["POST"])
def get_file():
    data = request.get_json()
    response_data = send_file_to_api(data)

if __name__ == '__main__':
    app.run(debug=True)
