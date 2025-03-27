import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Dialog, showDialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { requestAPI } from './handler';
import { createMetadataEditor } from './cm';
import { playback } from './playback';
import { checkSyntax } from './syntax';

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-playback:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker, ISettingRegistry],
  activate: async (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    settingRegistry: ISettingRegistry
  ) => {
    console.log('JupyterLab extension jupyterlab-playback is activated!');
    const settings = await settingRegistry.load(plugin.id);
    const metadataEditorWidth = settings.get('metadataEditorWidth')
      .composite as number;
    const includeMarkdown = settings.get('includeMarkdown')
      .composite as boolean;

    notebookTracker.widgetAdded.connect(
      async (_, notebookPanel: NotebookPanel) => {
        await notebookPanel.revealed;
        await notebookPanel.sessionContext.ready;

        // const firstCell = notebookPanel.content.widgets[0] as MarkdownCell
        // firstCell.renderedChanged.connect(() => console.log('******', firstCell.rendered))

        const button = document.createElement('button');
        button.id = 'extension-button';
        const node = document.createElement('div');
        node.appendChild(button);
        notebookPanel.toolbar.insertAfter(
          'spacer',
          'button',
          new Widget({ node: node })
        );

        if (notebookPanel.model?.cells) {
          for (let i = 0; i < notebookPanel.model?.cells.length; i++) {
            const cell = notebookPanel.model?.cells.get(i);
            if (!cell.getMetadata('id')) {
              cell.setMetadata('id', cell.id);
            }
          }
        }

        const mode = notebookPanel.model?.getMetadata('mode');
        if (!mode) {
          notebookPanel.model?.setMetadata('mode', 'editor');
        }
        if (!mode || mode === 'editor') {
          createMetadataEditor(
            notebookPanel,
            metadataEditorWidth,
            includeMarkdown
          );
          button.innerHTML = 'Generate an interactive notebook';
          button.onclick = async () => {
            button.innerHTML = 'Checking syntax...';
            const { isValid, message, nbAudioMap, nbMap } = await checkSyntax(
              notebookPanel,
              includeMarkdown
            );
            if (!isValid) {
              showDialog({
                body: message,
                buttons: [
                  Dialog.createButton({
                    label: 'Dismiss',
                    className: 'jp-Dialog-button jp-mod-reject jp-mod-styled'
                  })
                ]
              });
            } else {
              button.innerHTML = 'Generating notebook...';
              const response: any = await requestAPI('load', {
                method: 'POST',
                body: JSON.stringify({
                  data: notebookPanel?.model?.toJSON(),
                  relativePath: notebookTracker.currentWidget?.context.path,
                  nbAudioMap,
                  nbMap
                })
              });
              showDialog({
                body: response,
                buttons: [
                  Dialog.createButton({
                    label: 'Dismiss',
                    className: 'jp-Dialog-button jp-mod-reject jp-mod-styled'
                  })
                ]
              });
            }
            button.innerHTML = 'Regenerate interactive notebook';
          };
        } else if (mode === 'player') {
          button.innerHTML = ' ▶ ';
          notebookPanel.model?.setMetadata('isPlaying', false);
          button.onclick = () => {
            const isPlaying =
              notebookPanel.model?.getMetadata('isPlaying') || false;
            notebookPanel.model?.setMetadata('isPlaying', !isPlaying);
            if (!isPlaying) {
              playback(notebookPanel, includeMarkdown);
            }
          };
        }
      }
    );
  }
};

export default plugin;
