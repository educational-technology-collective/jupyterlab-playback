import json
import tornado
from playsound import playsound
import os
import librosa
# import boto3

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerMixin


class RouteHandler(ExtensionHandlerMixin, JupyterHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

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
            body = json.loads(self.request.body)
            if resource == "audio":
                audio_index = body.get('audio_index')
                filename = f'/Users/mengyanw/University of Michigan Dropbox/Mengyan Wu/video/examples/audio/{audio_index}.wav'
                self.finish(json.dumps({
                    "duration": librosa.get_duration(filename=filename)
                }))
                playsound(filename)
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