import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';
import { requestAPI } from './handler';
import { createMetadataEditor } from './cm';
import { playback } from './playback';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'text2video:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker],
  activate: async (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('JupyterLab extension text2video is activated!');

    notebookTracker.widgetAdded.connect(
      async (_, notebookPanel: NotebookPanel) => {
        await notebookPanel.revealed;
        await notebookPanel.sessionContext.ready;

        const button = document.createElement('button');
        button.id = 'extension-button';
        const node = document.createElement('div');
        node.appendChild(button);
        notebookPanel.toolbar.insertAfter(
          'spacer',
          'button',
          new Widget({ node: node })
        );

        const mode = notebookPanel.model?.getMetadata('mode');
        if (!mode) notebookPanel.model?.setMetadata('mode', 'editor');
        if (!mode || mode === 'editor') {
          createMetadataEditor(notebookPanel);
          button.innerHTML = 'Generate an interactive notebook';
          button.onclick = async () => {
            button.innerHTML = 'Generating notebook...';
            const response: any = await requestAPI('load', {
              method: 'POST',
              body: JSON.stringify({
                data: notebookPanel?.model?.toJSON()
              })
            });
            console.log(response);
            button.innerHTML = 'Regenerate interactive notebook';
          };
        } else if (mode === 'player') {
          button.innerHTML = ' ▶ ';
          notebookPanel.model?.setMetadata('isPlaying', false);
          button.onclick = () => {
            const isPlaying =
              notebookPanel.model?.getMetadata('isPlaying') || false;
            notebookPanel.model?.setMetadata('isPlaying', !isPlaying);
            button.innerHTML = "<span class='loader'></span>";
            if (!isPlaying) playback(notebookPanel);
          };
        }
      }
    );
  }
};

export default plugin;
