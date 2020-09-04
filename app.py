from flask import Flask
from threading import Thread
import glob
import os


# set to `devel = False` for deployment
devel = False
prerender = False

# port `80` is enforced if devel = False
devport = 5000

# host `0.0.0.0` is enforced if devel = False
devhost = '127.0.0.1'

# rendered html extension:
ext = '_render.html'
static = "./demos/" if devel else "./production/"


# default html chunks:
header = static + 'templates/header.html'
footer = static + 'templates/footer.html'


app = Flask(__name__, static_folder=static)


"""
rendering:
 if we were using a templating engine like jade,
 we'd make some additional modifications to the api like so:
    ```
    app.jinja_env.addextension('pyjade.ext.jinja.PyJadeExtension')
    app.secret_key = 'super secret key'
    app.config['SESSION_TYPE'] = 'filesystem'
    ```
 ...for now, lets just write our own plebeian renderer
"""


def render(src_list, f):
    """
    :param src_list: ordered list of HTML file chunks to render
    :return: void
    """

    renderf = f + ext

    with open(renderf, "w+") as rendering:
        for item in src_list:
            with open(item) as i:
                for line in i:
                    rendering.write(line)
            i.close()
    rendering.close()


# on launch, check & build renders:
def prerender_thread():

    # get a list of html files to render:
    html_list = glob.glob(static + '*.html')

    def _iter():
        for each in html_list:
            render([header, each, footer], each)

    return Thread(target=_iter())


""" routing """


@app.route('/crop_3')
def crop_3():
    return app.send_static_file('spec_record_crop_v3.html' + ext)


@app.route('/crop_dl')
def crop_4():
    return app.send_static_file('spec_record_crop_dl.html' + ext)


@app.route('/')
def webgl_init():
    return app.send_static_file('webgl_init.html' + ext)


@app.route('/display')
def disp():
    return app.send_static_file('spec_display.html' + ext)


@app.route('/load')
def load():
    return app.send_static_file('load_audio.html' + ext)


@app.route('/record_v2')
def rec2():
    return app.send_static_file('spec_record_v2.html' + ext)


@app.route('/webgl')
def webgl():
    return app.send_static_file('webgl_float_test.html' + ext)


@app.route('/leaflet')
def leaflet():
    return app.send_static_file('annotator.html')


if prerender:
    print('please wait while prerendering html...')
    prerender = prerender_thread()
    prerender.start()

    # block until renders are done:
    prerender.join()
    print('...prerendering complete!  \n:)')


if devel:
    hostport = devport
    hosturl = devhost
else:
    hostport = 80
    hosturl = '0.0.0.0'


if __name__ == "__main__":
    app.run(host=hosturl, port=os.environ.get('PORT', hostport))
