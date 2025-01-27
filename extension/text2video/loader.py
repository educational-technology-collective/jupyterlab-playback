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

from dotenv import load_dotenv
load_dotenv()

directory = os.getcwd()
            
def get_audio(
    # user: str,
    # key: str,
    text: Iterable[str],
    voice: str,
    language: str,
    fileIndex: int,
    client: Client,
):
    def save_audio(data: Generator[bytes, None, None] | Iterable[bytes]):
        chunks: bytearray = bytearray()
        for chunk in data:
            chunks.extend(chunk)
        with open(f"{directory}/audio/{fileIndex}.wav", "w+b") as f:
            f.write(chunks)

    # Set the speech options
    options = TTSOptions(voice=voice, language=Language(language))

    # Get the streams
    # if use_http:
    #     voice_engine = "Play3.0-mini-http"
    # elif use_ws:
    #     voice_engine = "Play3.0-mini-ws"
    # else:
    #     voice_engine = "PlayHT2.0"

    voice_engine = "Play3.0-mini-http" 
    in_stream, out_stream = client.get_stream_pair(options, voice_engine=voice_engine)

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
    return f"{directory}/audio/{fileIndex}.wav"

async def loader(data):
    notebook_audiobase = []
    notebook_map = []
    audio_index = 0
        
    for celli, cell in enumerate(data['cells']):
        # print("***", cell, type(cell))
        source = cell['source'].split('\n')
        base_map = cell['metadata']['map']
        cell_map = []
        if cell['cell_type'] == 'code':
            audiobase = []
            for linei, line in enumerate(source):
                command_list = base_map[linei]['command']
                line_map = {
                    "command": command_list,
                    "text": line
                }
                if 'AUDIO' in command_list:
                    if line.startswith('#'):
                        if line.endswith('\n'):
                            audiobase.append(line[2:-1])
                        else:
                            audiobase.append(line[2:])
                    else:
                        print(f"Bad syntax for AUDIO command, line should start with #: {line}")
                    line_map['audio_index'] = audio_index
                elif any('AUDIOALT' in command for command in command_list):
                    alt_text = [command.split('|')[-1] for command in command_list if 'AUDIOALT' in command][-1]
                    if not alt_text or alt_text == 'AUDIOALT':
                       print(f"Bad syntax for AUDIOALT command, the command should be followed by | <alt_text>: {command}")
                    else:
                        audiobase.append(alt_text)
                    line_map['audio_index'] = audio_index
                    # print(alt_text)
                    # print(line_map['text'])
                elif 'AUDIO' not in command_list and not any('AUDIOALT' in command for command in command_list) and audiobase != []:
                    notebook_audiobase.append(' '.join(audiobase))
                    audio_index += 1
                    audiobase = []
                cell_map.append(line_map)
            if audiobase != []:
                notebook_audiobase.append(' '.join(audiobase)) 
                audio_index += 1
        notebook_map.append(cell_map)

    client = Client(
        user_id=os.getenv('user_id'),
        api_key=os.getenv('api_key'),
    )
    audio_src_map = []
    for i, base in enumerate(notebook_audiobase):
        print(base)
        audio_src = get_audio(
            [base],
            os.getenv('voice'),
            "english",
            i,
            client)
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
        each['source'] = []
        each['metadata']['full_map'] = notebook_map[i]
    notebook['metadata']['mode'] = 'player'
    
    with open(f'{directory}/player.ipynb', 'w') as f:
        json.dump(notebook, f, indent=4)
    
    return 'success'