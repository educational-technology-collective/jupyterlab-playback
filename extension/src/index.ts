import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  INotebookTracker,
  NotebookPanel,
  CellList,
  NotebookActions
} from '@jupyterlab/notebook';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { StateEffect } from '@codemirror/state';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Widget } from '@lumino/widgets';
import { requestAPI } from './handler';
import { highlightLinePlugin } from './cm';

const Status = Object.freeze({
  Play: 1,
  Pause: 2,
  End: 3
});

let currentStatus: 1 | 2 | 3 = Status.Pause;

const playBack = async (notebookPanel: NotebookPanel) => {
  const cells = notebookPanel.model?.cells;

  if (cells) {
    let currentAudio = null;
    for (let i = 0; i < cells.length; i++) {
      let source = '';
      const cell: ICellModel = cells.get(i);
      const cellMap = cell.getMetadata('map');
      console.log(cellMap);

      for (let j = 0; j < cellMap?.length; j++) {
        const commands = cellMap[j]['command'];
        const text = cellMap[j]['text'];
        for (const command of commands) {
          if (command.includes('AUDIO')) {
            const audioSrc = cellMap[j]['audio_src'];
            console.log(audioSrc);
            if (audioSrc !== currentAudio) {
              currentAudio = audioSrc;
              const response: any = await requestAPI('audio', {
                method: 'POST',
                body: JSON.stringify({
                  audio_src: currentAudio
                })
              });
            }
          }
          if (command.includes('TYPE')) {
            const chunk = [...text];
            for (let char of chunk) {
              source += char;
              cell.sharedModel.setSource(source);
              await new Promise(resolve => {
                setTimeout(resolve, 50);
              });
            }
          }
          if (command.includes('PAUSE')) {
            const time = command.replace(/\D/g, '');
            source += '\n';
            cell.sharedModel.setSource(source);
            await new Promise(resolve => {
              setTimeout(resolve, time);
            });
          }
          if (command.includes('SELECT')) {
            console.log('***', command);
            const lineToHighlight = command.replace(/\D/g, '');
            const cm = notebookPanel.content.widgets[i]
              ?.editor as CodeMirrorEditor;
            const highlightPlugin = highlightLinePlugin(lineToHighlight);

            // Apply the highlight plugin to the existing instance
            cm.editor.dispatch({
              effects: StateEffect.appendConfig.of([highlightPlugin])
            });
          }
          if (command.includes('EXECUTE')) {
            console.log('***', 'EXECUTE');
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
};

const createMetadataEditor = (notebookPanel: NotebookPanel) => {
  const length = notebookPanel.model?.cells.length || 0;
  for (let j = 0; j < length; j++) {
    const node = notebookPanel.content.widgets[j].node;
    const cellInputWrapper = node.getElementsByClassName(
      'jp-Cell-inputWrapper'
    )[0];
    const host = document.createElement('div');
    host.classList.add('host', 'lm-widget');
    // placeholder.style.background = 'beige'
    host.style.width = '50%';
    const map: Array<any> = notebookPanel.model?.cells
      .get(j)
      .getMetadata('map');
    const len = map.length;
    host.style.height = (18 * len).toString() + 'px';

    for (let i = 0; i < len; i++) {
      const line = document.createElement('input');
      line.classList.add('line');
      line.style.width = '100%';
      // line.style.height = '18px'
      // line.style.background = 'brown'
      line.style.lineHeight = '13px';
      line.style.fontSize = '13px';
      line.style.border = 'none';
      line.style.padding = '1.5px 5px 1.5px 5px';
      // line.style.textAlign = 'center'
      line.value = map[i]['command'].join(',');
      host.appendChild(line);
    }
    cellInputWrapper.appendChild(host);
  }
};

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'text2video:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker],
  activate: async (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('JupyterLab extension text2video is activated!');

    const style = document.createElement('style');
    style.textContent = `
      .highlight-line {
        background-color: yellow;
      }
    `;
    document.head.appendChild(style);

    const playButton = document.createElement('button');
    playButton.innerText = 'Play';
    playButton.id = 'play-button';

    const node = document.createElement('div');
    node.appendChild(playButton);

    notebookTracker.widgetAdded.connect(
      async (_, notebookPanel: NotebookPanel) => {
        await notebookPanel.revealed;
        await notebookPanel.sessionContext.ready;

        createMetadataEditor(notebookPanel);

        notebookPanel.toolbar.insertAfter(
          'spacer',
          'play-button',
          new Widget({ node: node })
        );

        playButton.onclick = () => {
          currentStatus =
            currentStatus === Status.Play ? Status.Pause : Status.Play;
          playButton.innerText =
            playButton.innerText === 'Play' ? 'Pause' : 'Play';
          if (currentStatus === Status.Play) playBack(notebookPanel);
        };
      }
    );
  }
};

export default plugin;
