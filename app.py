from flask import Flask, render_template, request, jsonify
from ontology import load_and_process_owl, generate_evaluation_scales
app = Flask(__name__)

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

@app.route('/')
def index():
    return render_template("page.html")


if __name__ == '__main__':
    app.run(debug=True)
