from flask import Flask
app = Flask(__name__, static_folder='./demos/')

@app.route('/')
def home():
    return app.send_static_file('spec_record_crop.html')

if __name__ == '__main__':
    flask_app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))