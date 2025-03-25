from __future__ import annotations

import json
import asyncio
import select
import sys
import threading
import re
import subprocess
import os
from typing import AsyncGenerator, AsyncIterable, Generator, Iterable

from pyht.async_client import AsyncClient
from pyht import Client
from pyht.client import TTSOptions, Language

# from dotenv import load_dotenv
# load_dotenv()

def get_audio(
    # user: str,
    # key: str,
    text: Iterable[str],
    voice: str,
    language: str,
    file_index: int,
    client: Client,
    folder_path: str
):
    os.makedirs(f"{folder_path}/audio", exist_ok=True)

    def save_audio(data: Generator[bytes, None, None] | Iterable[bytes]):
        chunks: bytearray = bytearray()
        for chunk in data:
            chunks.extend(chunk)
        with open(f"{folder_path}/audio/{file_index}.wav", "w+b") as f:
            f.write(chunks)

    # Set the speech options
    options = TTSOptions(voice=voice, language=Language(language))

    # Get the streams
    in_stream, out_stream = client.get_stream_pair(options, voice_engine='Play3.0-mini', protocol='http')

    # Start a player thread.
    audio_thread = threading.Thread(None, save_audio, args=(out_stream,))
    audio_thread.start()

    # Send some text, play some audio.
    for t in text:
        in_stream(t)
    in_stream.done()

    # cleanup
    audio_thread.join()
    out_stream.close()

    metrics = client.metrics()
    # print(str(metrics[-1].timers.get("time-to-first-audio")))

    # Cleanup.
    return f"{folder_path}/audio/{file_index}.wav"

async def loader(data, relative_path, notebook_audiobase, notebook_map):
    filename = relative_path.split('/')[-1]
    folder_path = '/'.join(relative_path.split('/')[:-1]) or '.'

    audio_index = 0

    print(os.getenv('playht_user_id'), os.getenv('playht_api_key'), os.getenv('playht_voice_model'))
    client = Client(
        user_id=os.getenv('playht_user_id'),
        api_key=os.getenv('playht_api_key'),
    )
    audio_src_map = []
    for i, base in enumerate(notebook_audiobase):
        print(base)
        audio_src = get_audio(
            [base],
            os.getenv('playht_voice_model'),
            "english",
            i,
            client,
            folder_path)
        audio_src_map.append(audio_src)
    client.close()

    for cell_map in notebook_map:
        for line_map in cell_map:
            print("line", line_map)
            if line_map.get('audio_index') is not None:
                line_map['audio_src'] = audio_src_map[line_map['audio_index']]

    print(notebook_audiobase)
    print(notebook_map)

    notebook = data.copy()
    for i, each in enumerate(notebook['cells']):
        if (each['cell_type'] == 'code'):
            each['source'] = []
        each['metadata']['full_map'] = notebook_map[i]
    notebook['metadata']['mode'] = 'player'
    
    with open(f'{folder_path}/{filename[:-6]}_playback.ipynb', 'w') as f:
        json.dump(notebook, f, indent=4)
    
    return 'success'