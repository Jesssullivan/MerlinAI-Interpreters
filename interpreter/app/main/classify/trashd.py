from .config import *
import shutil  # 2026: replaces `rm -rf` / `mkdir` through a shell


# garbage collector for uploaded files to be classified.


class Trash(object):

    @ staticmethod
    def _force_dir_rm(path):
        # checking and removing user dirs from OS-
        # assuming child threads may occasionally misbehave,
        # best to avoid guessing the state of child threads here in Python
        # 2026: shutil.rmtree, never a shell-interpolated path
        shutil.rmtree(path, ignore_errors=True)

    @classmethod
    def discard(cls, path):
        # 2026: remove a request's upload directory as soon as its response is built;
        # the garbage loop below stays as a backstop
        cls._force_dir_rm(path)

    @classmethod
    def _garbage_loop(cls):

        # this is process is what loops around in the garbage daemon's thread.
        while True:

            # most of the time, collector is idle:
            time.sleep(collection_int)

            for usr in os.listdir(inpath):

                # live app dict is solely managed here;
                # users are added only when daemon finds
                # new directories at each interval `collection_int`
                if usr not in live_app_list.keys():
                    live_app_list[usr] = time.time()

                if time.time() - live_app_list[usr] > collection_trash:
                    try:
                        vprint('removing expired usr directories...')
                        cls._force_dir_rm(os.path.join(inpath, usr))
                        live_app_list.pop(usr)

                    except:
                        print(str('Error while removing expired usr directory:  \n' + usr))

    @classmethod
    def truck(cls):
        if not os.path.exists('uploads'):
            os.makedirs(inpath, exist_ok=True)  # 2026: was `mkdir uploads` through a shell

        # start garbage loop as daemon- operating as a child to Flask server:
        init_loop = threading.Thread(target=cls._garbage_loop, daemon=True)
        init_loop.start()