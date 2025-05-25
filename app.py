from flask import Flask, render_template, request, jsonify
from ontology import load_and_process_owl, generate_evaluation_scales
import json
import os
import subprocess
from flask_cors import CORS
RESULT_PATH = "C:/Users/dimul/Desktop/Inter/result.json" # путь = output_dir / result.json
if os.path.exists(RESULT_PATH):
    os.remove(RESULT_PATH)
app = Flask(__name__)
CORS(app)
owl_file_path = r'C:/Users/dimul/Desktop/Inter/library.owl' # путь к файлу онтологии
input_path = "C:/Users/dimul/Desktop/Inter/input.json" # путь к файлу, куда записываются данные с клиента
output_dir = "C:/Users/dimul/Desktop/Inter/" # путь к директории с проектом
jar_path = "C:/Users/dimul/Desktop/Inter/lingvo-dss-all.jar" # путь к файлу с решателем


@app.route("/load-scales", methods=["GET"])
def load_scales():
    g, criteria = load_and_process_owl(owl_file_path)
    scales = generate_evaluation_scales(criteria, g)
    formatted_scales = {prop: details['details']['values'] for prop, details in scales.items() if details['type'] == 'Качественный'}
    for prop, details in scales.items():
        if details['type'] == 'Качественный':
            mas_of_evaluations = details.get('details').get('values')
            prom = mas_of_evaluations[0]
            mas_of_evaluations[0] = mas_of_evaluations[1]
            mas_of_evaluations[1] = prom
            details['details']['values'] = mas_of_evaluations
            formatted_scales[prop] = details['details']['values']
    return jsonify(formatted_scales)
@app.route('/cleanup', methods=['POST'])
def cleanup():
    if os.path.exists(RESULT_PATH):
        os.remove(RESULT_PATH)
    return jsonify({"status": "success", "message": "Cleanup completed"})

@app.route("/load-quantitative-scales", methods=["GET"])
def load_quantitative_scales():
    g, criteria = load_and_process_owl(owl_file_path)
    scales = generate_evaluation_scales(criteria, g)
    flag = False
    quantitative_scales = {}
    for prop, details in scales.items():
        if details['type'] == 'Количественный':
            if details['details'].get('minInclusive', 'Не указано') == 0:
                if details['details'].get('minInclusive', 'Не указано') == 0 and details['details'].get('maxInclusive', 'Не указано') == 10 and not flag:
                    flag = True
                    quantitative_scales[prop] = {
                        'min': 1,
                        'max': details['details'].get('maxInclusive', 'Не указано')
                    }
                else:
                    if details['details'].get('maxInclusive', 'Не указано') != 10:
                        quantitative_scales[prop] = {
                            'min': 1,
                            'max': details['details'].get('maxInclusive', 'Не указано')
                        }
            else:
                quantitative_scales[prop] = {
                    'min': details['details'].get('minInclusive', 'Не указано'),
                    'max': details['details'].get('maxInclusive', 'Не указано')
                }
    return jsonify(quantitative_scales)


def send_file_to_api(data):
    os.makedirs((os.path.dirname(input_path)), exist_ok=True)
    try:
        with open(input_path, "w", encoding="UTF-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        return jsonify({"error": f"Failed to write JSON file {e}"})
    if not os.path.isfile(jar_path):
        return jsonify({"error": "No jar"})
    com = ["java", "-jar", jar_path, "-i", input_path, "-o", output_dir]
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
@app.route('/check_file', methods=['GET'])
def check_file():
    exists = os.path.exists(RESULT_PATH)
    return jsonify({'exists': exists})

@app.route("/send_json_to_js", methods=["GET"])
def send_json_to_js():
    with open(RESULT_PATH, encoding="UTF-8") as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/')
def index():
    return render_template("page.html")
@app.route("/get_file", methods=["POST"])
def get_file():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Нет данных"})
    response_data = send_file_to_api(data)
    return response_data

if __name__ == '__main__':
    app.run(debug=True)
