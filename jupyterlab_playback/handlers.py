import json
import tornado
import os
import pygame

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin

from .loader import loader

class RouteHandler(ExtensionHandlerMixin, JupyterHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        pygame.init()

    @tornado.web.authenticated
    async def get(self, resource):
        try:
            self.set_header("Content-Type", "application/json")
            if resource == "version":
                self.finish(json.dumps(__version__))
            else:
                self.set_status(404)
        except Exception as e:
            self.log.error(str(e))
            self.set_status(500)
            self.finish(json.dumps(str(e)))

    @tornado.web.authenticated
    async def post(self, resource):
        try:
            if resource == "audio":
                body = json.loads(self.request.body)
                audio_src = body.get('audio_src') 
                pygame.mixer.music.load(audio_src)
                pygame.mixer.music.play()
            if resource == "load":
                body = json.loads(self.request.body)
                data = body.get('data')
                relative_path = body.get('relativePath')
                nb_audio_map = body.get('nbAudioMap')
                nb_map = body.get('nbMap')
                await loader(data, relative_path, nb_audio_map, nb_map)
                self.finish("Interactive notebook generated successfully!")
            if resource == "stop":
                pygame.mixer.music.stop()
                pygame.mixer.music.unload()
            # if resource == "pause":
            #     # pos = pygame.mixer.music.get_pos()
            #     pygame.mixer.music.pause()
            # if resource == "unpause":
            #     pygame.mixer.music.unpause()
        except Exception as e:
            self.log.error(str(e))
            self.set_status(500)
            self.finish(json.dumps(str(e)))