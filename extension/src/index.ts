import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel, CellList, NotebookActions } from '@jupyterlab/notebook';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { StateEffect } from "@codemirror/state";
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { requestAPI } from './handler';
import { highlightLinePlugin } from './cm';

const playBack = async (notebookPanel: NotebookPanel) => {  
  const cells = notebookPanel.model?.cells

  if (cells) {
    let currentAudio = -1
    for (let i = 0; i < cells.length; i++) {
      let source = ''
      const cell: ICellModel = cells.get(i)
      const cellMap = cell.getMetadata('map')
      console.log(cellMap)

      for (let j = 0; j < cellMap?.length; j++) {
        const commands = cellMap[j]['command']
        const text = cellMap[j]['text']
        for (const command of commands) {
          if (command.includes('AUDIO')) {
            const audioIndex = cellMap[j]['audio_index']
            if (audioIndex !== currentAudio) {
              currentAudio = audioIndex
              const response: any = await requestAPI('audio', {
                method: 'POST',
                body: JSON.stringify({
                  audio_index: currentAudio
                })
              })
            }
          }
          if (command.includes('TYPE')) {
            const chunk = [...text]
            for (let char of chunk) {
              source += char
              cell.sharedModel.setSource(source)
              await new Promise((resolve) => {
                  setTimeout(resolve, 10);
              });
            }  
          }
          if (command.includes('PAUSE')) {
            const time = command.replace(/\D/g, '')
            source += "\n"
            cell.sharedModel.setSource(source)
            await new Promise((resolve) => {
                setTimeout(resolve, time);
            });
          }
          if (command.includes('SELECT')) {
            console.log("***", command)
            const lineToHighlight = command.replace(/\D/g, '')
            const cm = notebookPanel.content.widgets[i]?.editor as CodeMirrorEditor
            const highlightPlugin = highlightLinePlugin(lineToHighlight);

            // Apply the highlight plugin to the existing instance
            cm.editor.dispatch({
                effects: StateEffect.appendConfig.of([highlightPlugin])
                })
            };
          if (command.includes('EXECUTE')) {
            console.log("***", "EXECUTE")
            NotebookActions.runCells(notebookPanel.content, [notebookPanel.content.widgets[i]], notebookPanel.context.sessionContext)
          }
          }
        }
      }
    }
  }

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
    notebookTracker.widgetAdded.connect(
      async (_, notebookPanel: NotebookPanel) => {
        await notebookPanel.revealed;
        await notebookPanel.sessionContext.ready;

        playBack(notebookPanel)
      }
    )
  }
};

export default plugin;
