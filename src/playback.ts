import { NotebookPanel, NotebookActions } from '@jupyterlab/notebook';
import { ICellModel } from '@jupyterlab/cells';
import { StateEffect } from '@codemirror/state';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { requestAPI } from './handler';
import { highlightLinePlugin } from './cm';

const stop = async (
  cellMap: any,
  i: number,
  j: number,
  notebookPanel: NotebookPanel
) => {
  const button = document.getElementById('extension-button');
  let jj = j;
  if ('audio_index' in cellMap[j]) {
    while (
      jj > 0 &&
      'audio_index' in cellMap[jj - 1] &&
      cellMap[jj - 1]['audio_index'] === cellMap[jj]['audio_index']
    ) {
      jj -= 1;
    }
  }
  notebookPanel?.model?.setMetadata('cellIndex', i);
  notebookPanel?.model?.setMetadata('lineIndex', jj);
  if (button) {
    button.innerHTML = ' ▶ ';
  }
  const response: any = await requestAPI('stop', {
    method: 'POST',
    body: ''
  });
  console.log(response);
};
export const playback = async (
  notebookPanel: NotebookPanel,
  includeMarkdown: boolean
) => {
  const cells = notebookPanel.model?.cells;
  const cellIndex = notebookPanel.model?.getMetadata('cellIndex') || 0;
  const lineIndex = notebookPanel.model?.getMetadata('lineIndex') || 0;
  const button = document.getElementById('extension-button');

  if (cells) {
    if (button) {
      button.innerHTML = '||';
    } else {
      console.warn('null button');
    }
    let currentAudio = null;
    for (let i = cellIndex; i < cells.length; i++) {
      let source = '';
      const cell: ICellModel = cells.get(i);
      if (
        cell.type === 'code' ||
        (includeMarkdown && cell.type === 'markdown')
      ) {
        const cellMap = cell.getMetadata('full_map');

        for (let j = 0; j < cellMap?.length; j++) {
          const commands: Array<string> = cellMap[j]['command'];
          const text = cellMap[j]['text'];
          if (i === cellIndex && j < lineIndex) {
            if (cell.type === 'code') {
              source += text;
              if (j !== cellMap?.length - 1) {
                source += '\n';
              }
              cell.sharedModel.setSource(source);
            }
            // else if (cell.type === 'markdown') continue
          } else {
            const isPlaying = notebookPanel.model.getMetadata('isPlaying');
            if (!isPlaying) {
              await stop(cellMap, i, j, notebookPanel);
              return;
            }
            if (commands.some((command: string) => command.includes('AUDIO'))) {
              const audioSrc = cellMap[j]['audio_src'];
              if (audioSrc !== currentAudio) {
                currentAudio = audioSrc;
                const response = await requestAPI('audio', {
                  method: 'POST',
                  body: JSON.stringify({
                    audio_src: currentAudio
                  })
                });
                console.log(response);
              }
            }
            if (cell.type === 'markdown') {
              for (let k = 0; k < [...text].length; k++) {
                await new Promise(resolve => {
                  setTimeout(resolve, 50);
                });
                const isPlaying = notebookPanel.model.getMetadata('isPlaying');
                if (!isPlaying) {
                  await stop(cellMap, i, j, notebookPanel);
                  return;
                }
              }
            }
            for (const command of commands) {
              if (command.startsWith('TYPE')) {
                const chunk = [...text];
                if (j !== cellMap?.length - 1) {
                  chunk.push('\n');
                }
                for (const char of chunk) {
                  source += char;
                  cell.sharedModel.setSource(source);
                  await new Promise(resolve => {
                    setTimeout(resolve, 50);
                  });

                  const isPlaying =
                    notebookPanel.model.getMetadata('isPlaying');
                  if (!isPlaying) {
                    await stop(cellMap, i, j, notebookPanel);
                    return;
                  }
                }
              }
              if (command.startsWith('PAUSE')) {
                const time = parseInt(command.replace(/\D/g, ''));
                if (cell.type === 'code') {
                  source += '\n';
                  cell.sharedModel.setSource(source);
                }
                await new Promise(resolve => {
                  setTimeout(resolve, time);
                });
              }
              if (command.startsWith('SELECT')) {
                const lineToHighlight = parseInt(command.replace(/\D/g, ''));
                const cm = notebookPanel.content.widgets[i]
                  ?.editor as CodeMirrorEditor;
                const highlightPlugin = highlightLinePlugin(lineToHighlight);

                // Apply the highlight plugin to the existing instance
                cm.editor.dispatch({
                  effects: StateEffect.appendConfig.of([highlightPlugin])
                });
              }
              if (command.startsWith('EXECUTE')) {
                NotebookActions.runCells(
                  notebookPanel.content,
                  [notebookPanel.content.widgets[i]],
                  notebookPanel.context.sessionContext
                );
              }
            }
          }
        }
      }
    }
  }
  if (button) {
    button.innerHTML = ' ▶ '; // end of notebook or no cell available
  }
  notebookPanel.model?.setMetadata('cellIndex', '');
  notebookPanel.model?.setMetadata('lineIndex', '');
  notebookPanel.model?.setMetadata('isPlaying', false);
};
