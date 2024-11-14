from jupyter_server.extension.application import ExtensionApp
from .handlers import RouteHandler

class text2videoApp(ExtensionApp):
    name = "text2video"
    jobs = {}

    def initialize_handlers(self):
        try:
            self.handlers.extend([(r"/text2video/(.*)", RouteHandler)])
        except Exception as e:
            self.log.error(str(e))
            raise e