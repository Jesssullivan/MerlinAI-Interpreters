
from threading import Thread
from config import *


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


class Render(object):

    @staticmethod
    def _render(src_list, f):
        """
        :param src_list: ordered list of HTML file chunks to render
        :return: void
        """

        renderf = f + ext

        with open(renderf, "w+") as rendering:
            for item in src_list:
                with open(item) as i:
                    print('rendering ' + item)
                    for line in i:
                        rendering.write(line)
                i.close()
        rendering.close()

    # on launch, check & build renders:
    @classmethod
    def _thread(cls, header=header, footer=footer):

        # get a list of html files to render:
        html_list = glob.glob(static + '*.html')

        def _iter():
            for each in html_list:
                cls._render([header, each, footer], each)

        return Thread(target=_iter())

    @classmethod
    def render(cls):
        print('prerendering html...')

        render_thread = cls._thread(header=header, footer=footer)
        render_thread.start()

        # wait until renders are done:
        render_thread.join()
        print('...prerendering complete!  \n:)')