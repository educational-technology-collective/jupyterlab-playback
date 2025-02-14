from jupyter_server.extension.application import ExtensionApp
from .handlers import RouteHandler

class JupyterLabPlaybackApp(ExtensionApp):
    name = "jupyterlab-playback"
    jobs = {}

    def initialize_handlers(self):
        try:
            self.handlers.extend([(r"/jupyterlab-playback/(.*)", RouteHandler)])
        except Exception as e:
            self.log.error(str(e))
            raise e