from flask import Flask
import threading
import os
import time

""" global """

# set to `devel = False` for deployment
devel = False
prerender = False

# port `80` is enforced if devel = False
devport = 5000

# host `0.0.0.0` is enforced if devel = False
devhost = '127.0.0.1'

# rendered html extension:
_ext = '_render.html'
static = "./demos/" if devel else "./production/"

# default html chunks:
header = static + 'templates/header.html'
footer = static + 'templates/footer.html'

html_list = [
    static + 'load_audio.html',
    static + 'spec_display.html',
    static + 'spec_record_crop_v3.html',
    static + 'spec_record_v2.html'
]

app = Flask(__name__, static_folder=static)


""" 
rendering:
 if we were using a templating engine like jade,
 we'd make some additional modifications to the api like so:
    ```
    app.jinja_env.add_extension('pyjade.ext.jinja.PyJadeExtension')
    app.secret_key = 'super secret key'
    app.config['SESSION_TYPE'] = 'filesystem'
    ```
"""


# ...for now, lets just write our own plebeian renderer-
def render(src_list, f):
    """
    :param src_list: ordered list of HTML file chunks to render
    :return: void
    """
    renderf = f + _ext

    if os.path.isfile(renderf):
        os.remove(renderf)
        time.sleep(.05)  # just to provide server a minor fs buffer

    with open(renderf, "w+") as rendering:
        for item in src_list:
            with open(item) as i:
                for line in i:
                    rendering.write(line)
            i.close()
    rendering.close()


# on launch, check & build renders:
def prerender_thread():
    def _iter():
        for each in html_list:
            render([header, each, footer], each)

    return threading.Thread(target=_iter())


@app.route('/')
def crop_3():
    return app.send_static_file('spec_record_crop_v3.html' + _ext)


@app.route('/display')
def disp():
    return app.send_static_file('spec_display.html' + _ext)


@app.route('/load')
def load():
    return app.send_static_file('load_audio.html' + _ext)


@app.route('/record_v2')
def rec2():
    return app.send_static_file('spec_record_v2.html' + _ext)


@app.route('/leaflet')
def leaflet():
    return app.send_static_file('annotator.html')


if devel:
    type = 'development'
    hostport = devport
    hosturl = devhost
else:
    type = 'production'
    hostport = 80
    hosturl = '0.0.0.0'

if prerender:

    print('please wait while prerendering html...')
    prerender = prerender_thread()
    prerender.start()

    # block until renders are done:
    prerender.join()
    print('...prerendering complete!  \n:)')


print('starting ', type, ' Flask server!\n ',
      'URL: ', hosturl, '\n',
      'PORT: ', str(hostport))


if __name__ == "__main__":
    app.run(host=hosturl, port=os.environ.get('PORT', hostport))
