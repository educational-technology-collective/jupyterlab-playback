import json
import tornado
import os
import pygame
# import boto3

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
            elif resource == "id":
                self.finish(json.dumps(os.getenv('WORKSPACE_ID')))
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
                await loader(data=data)
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


    #     BUCKET_NAME = 'telemetry-edtech-labs-si-umich-edu'
    #     PREFIX = 'audio/audio/'
    #     s3 = boto3.
    # client(
    #         's3',
    #         aws_access_key_id=AWS_ACCESS_KEY,
    #         aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    #     )
    #     s3_object = s3.get_object(Bucket=BUCKET_NAME, Key='0.wav')

        # playsound(s3_object)
        # print('*************')
        # print(os.getcwd()