from flask import Flask
app = Flask(__name__, static_folder='./demos/')
@app.route('/')
def home():
    return app.send_static_file('spec_record_crop.html')
@app.route('/crop')
def crop():
    return app.send_static_file('spec_record_crop_v1.html')
@app.route('/display')
def disp():
    return app.send_static_file('spec_display.html')
@app.route('/load')
def load():
    return app.send_static_file('load_audio.html')
@app.route('/record')
def rec1():
    return app.send_static_file('spec_record.html')
@app.route('/record_v2')
def rec2():
    return app.send_static_file('spec_record_v2.html')
if __name__ == '__main__':
    flask_app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))
