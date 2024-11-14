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

client = Client(
    user_id=os.getenv('user_id'),
    api_key=os.getenv('api_key'),
)

def get_audio(
    # user: str,
    # key: str,
    text: Iterable[str],
    voice: str,
    language: str,
    fileIndex: int,
):
    def save_audio(data: Generator[bytes, None, None] | Iterable[bytes]):
        chunks: bytearray = bytearray()
        for chunk in data:
            chunks.extend(chunk)
        with open(f"examples/audio/{fileIndex}.wav", "wb") as f:
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
    return 0


with open('examples/stage1.ipynb', 'r') as file:
    data = json.load(file)
    
notebook_audiobase = []
notebook_map = []
audio_index = 0

for celli, cell in enumerate(data['cells']):
    cell_map = []
    if cell['cell_type'] == 'code':
        audiobase = []
        for line in cell['source']:
            match = re.search(r'\[(.*?)\]', line)
            print(match)
            commands = match.group(1) if match else None
            command_list = [x.strip() for x in commands.split(',')]
            text =  line.replace(f"[{commands}]", "")
            line_map = {
                "command": command_list,
                "text": text
            }
            if 'AUDIO' in command_list:
                if text.startswith('#'):
                    if text.endswith('\n'):
                        audiobase.append(text[2:-1])
                    else:
                        audiobase.append(text[2:])
                else:
                    print(f"bad syntax for AUDIO command: {line}")
                line_map['audio_index'] = audio_index
            elif 'AUDIOALT' in command_list:
                alt_text = re.findall(r'\*\*(.*?)\*\*', text)[0]
                line_map['text'] = text.replace(f"**{alt_text}**", "")
                audiobase.append(alt_text)
                line_map['audio_index'] = audio_index
                print(alt_text)
                print(line_map['text'])
            elif 'AUDIO' not in command_list and 'AUDIOALT' not in command_list and audiobase != []:
                notebook_audiobase.append(' '.join(audiobase))
                audio_index += 1
                audiobase = []
            cell_map.append(line_map)
        if audiobase != []:
            notebook_audiobase.append(' '.join(audiobase)) 
            audio_index += 1
    notebook_map.append(cell_map)

# for i, base in enumerate(notebook_audiobase):
#     print(base)   
#     get_audio(
#         [base],
#         "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json",
#         "english",
#         i)

print(notebook_audiobase)
print(notebook_map)

notebook = data.copy()
for i, each in enumerate(notebook['cells']):
    each['source'] = []
    each['metadata']['map'] = notebook_map[i]

with open('examples/stage2.ipynb', 'w') as f:
    json.dump(notebook, f, indent=4)

client.close()

subprocess.Popen(["jupyter", "lab", "--notebook-dir", "examples"])
