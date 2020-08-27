from flask import Flask


app = Flask(__name__, static_folder='./demos/')


@app.route('/')
def home():
    return app.send_static_file('index.html')


@app.route('/home')
def home():
    return app.send_static_file('index.html')

@app.route('/load_audio')
def load_audio():
    return app.send_static_file('load_audio.html')


@app.route('/spec_display')
def spec_display():
    return app.send_static_file('spec_display.html')


@app.route('/spec_record')
def spec_record():
    return app.send_static_file('spec_record.html')


@app.route('/spec_record_v2')
def spec_record_v2():
    return app.send_static_file('spec_record_v2.html')



@app.route('/spec_record_crop')
def spec_record_crop():
    return app.send_static_file('spec_record_crop.html')


@app.route('/spec_record_crop_v2')
def spec_record_crop_v2():
    return app.send_static_file('spec_record_crop_v2.html')


if __name__ == '__main__':
    flask_app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))