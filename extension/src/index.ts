import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  INotebookTracker,
  NotebookPanel,
  NotebookActions
} from '@jupyterlab/notebook';
import { ICellModel } from '@jupyterlab/cells';
import { StateEffect } from '@codemirror/state';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { Widget } from '@lumino/widgets';
import { requestAPI } from './handler';
import { highlightLinePlugin } from './cm';

import { EditorState } from '@codemirror/state';
import { lineNumbers } from '@codemirror/view';
import { EditorView, basicSetup } from 'codemirror';

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
    const cell = notebookPanel.model?.cells.get(j);
    if (cell) {
      const node = notebookPanel.content.widgets[j].node;
      const cellInputWrapper = node.getElementsByClassName(
        'jp-Cell-inputWrapper'
      )[0];
      const metadataEditor = document.createElement('div');
      metadataEditor.classList.add('metadata-editor');
      metadataEditor.style.width = '50%';

      const map2doc = (map: Array<any>) =>
        map ? map.map(lineMap => lineMap['command'].join(',')).join('\n') : '';
      const doc2map = (doc: string) =>
        doc.split('\n').map(line => ({ command: line.split(',') }));

      const state = EditorState.create({
        doc: map2doc(cell.getMetadata('map')),
        extensions: [
          basicSetup,
          lineNumbers(),
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              cell.setMetadata('map', doc2map(update.state.doc.toString()));
            }
          })
        ]
      });

      const view = new EditorView({
        state,
        parent: metadataEditor
      });

      function adjustLines(doc: string, numLines: number): string {
        const lines = doc.split('\n');
        while (lines.length < numLines) {
          lines.push(''); // Add empty lines
        }
        while (lines.length > numLines) {
          lines.pop(); // Remove extra lines
        }
        return lines.join('\n');
      }

      //   cell.contentChanged.connect(() => {
      //     const currentText = view.state.doc.toString();
      //     if (currentText !== cell.model.value.text) {
      //         view.dispatch({
      //             changes: {
      //                 from: 0,
      //                 to: currentText.length,
      //                 insert: cell.model.value.text
      //             }
      //         });
      //     }
      // });

      cellInputWrapper.appendChild(metadataEditor);
    }
  }
};

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'text2video:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker],
  activate: async (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('JupyterLab extension text2video is activated!');

    const playButton = document.createElement('button');
    playButton.innerText = 'Play';
    playButton.id = 'play-button';

    const node = document.createElement('div');
    node.appendChild(playButton);

    notebookTracker.widgetAdded.connect(
      async (_, notebookPanel: NotebookPanel) => {
        await notebookPanel.revealed;
        await notebookPanel.sessionContext.ready;

        const mode = notebookPanel.model?.getMetadata('mode');
        if (!mode) notebookPanel.model?.setMetadata('mode', 'editor');
        if (!mode || mode === 'editor') createMetadataEditor(notebookPanel);

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
