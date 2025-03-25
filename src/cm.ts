import { NotebookPanel } from '@jupyterlab/notebook';
import { basicSetup } from 'codemirror';
import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate,
  lineNumbers
} from '@codemirror/view';
import { EditorState, RangeSetBuilder } from '@codemirror/state';

const map2doc = (map: Array<any>) =>
  map ? map.map(lineMap => lineMap['command'].join('+')).join('\n') : '';
const doc2map = (doc: string) =>
  doc.split('\n').map(line => ({ command: line.split('+') }));

const source2template = (source: string, cellType: string) => {
  const sourceLines = source.split('\n');
  const sourceLength = sourceLines.length || 0;
  const map = [];
  if (cellType === 'code') {
    for (let i = 0; i < sourceLength; i++) {
      const sourceLine = sourceLines[i];
      if (/^\s*#/.test(sourceLine)) {
        // lines starting with '#' or ' #'
        map.push({ command: ['TYPE', 'AUDIO'] });
      } else if (/^\s*$/.test(sourceLine)) {
        // empty or contain only spaces
        map.push({ command: ['PAUSE500'] });
      } else {
        map.push({ command: ['TYPE'] });
      }
    }
  } else if (cellType === 'markdown') {
    for (let i = 0; i < sourceLength; i++) {
      const sourceLine = sourceLines[i];
      if (/^\s*#/.test(sourceLine)) {
        // lines starting with '#' or ' #'
        map.push({ command: [] });
      } else if (/^\s*$/.test(sourceLine) || /^\s*!/.test(sourceLine)) {
        // empty or contain only spaces or lines starting with '!'
        map.push({ command: ['PAUSE500'] });
      } else {
        map.push({ command: ['AUDIO'] });
      }
    }
  }
  const doc = map2doc(map);
  return { map, doc };
};

// Fix errors caused by delayed loading of cells
const getCellInputWrapper = (notebookPanel: NotebookPanel, index: number) =>
  new Promise<HTMLElement>(resolve => {
    const getElement = () => {
      const node = notebookPanel.content.widgets[index].node;
      const cellInputWrapper = node.getElementsByClassName(
        'lm-Widget lm-Panel jp-Cell-inputWrapper'
      )[0] as HTMLElement;
      if (cellInputWrapper) {
        resolve(cellInputWrapper);
      } else {
        requestAnimationFrame(getElement);
      }
    };
    getElement();
  });

export const createMetadataEditor = async (
  notebookPanel: NotebookPanel,
  metadataEditorWidth: number,
  includeMarkdown: boolean
) => {
  const length = notebookPanel.model?.cells.length || 0;
  for (let j = 0; j < length; j++) {
    const cell = notebookPanel.model?.cells.get(j);
    if (
      cell &&
      (cell.type === 'code' || (includeMarkdown && cell.type === 'markdown'))
    ) {
      await notebookPanel.content.widgets[j].ready;
      const cellInputWrapper = await getCellInputWrapper(notebookPanel, j);
      const cellInputArea = cellInputWrapper.getElementsByClassName(
        'jp-Cell-inputArea'
      )[0] as HTMLElement;
      cellInputArea.classList.add('code-editor');
      cellInputArea.style.width = (100 - metadataEditorWidth).toString() + '%';
      const metadataEditor = document.createElement('div');
      metadataEditor.classList.add('metadata-editor');
      metadataEditor.style.width = metadataEditorWidth.toString() + '%';

      const initialState = cell.getMetadata('map')
        ? map2doc(cell.getMetadata('map'))
        : (() => {
            const { map, doc } = source2template(
              cell.sharedModel.source,
              cell.type
            );
            cell.setMetadata('map', map);
            return doc;
          })();

      const state = EditorState.create({
        doc: initialState,
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

      new EditorView({
        state,
        parent: metadataEditor
      });

      cellInputWrapper.appendChild(metadataEditor);
    }
  }
};

// Function to create a highlight plugin for a specific line
export const highlightLinePlugin = (lineNumber: number) => {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = this.createLineHighlight(view, lineNumber);
      }

      createLineHighlight(view: EditorView, lineNumber: number): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();
        const line = view.state.doc.line(lineNumber);

        const lineDecoration = Decoration.line({ class: 'highlight-line' });
        builder.add(line.from, line.from, lineDecoration);
        return builder.finish();
      }

      update(update: ViewUpdate) {
        if (update.docChanged) {
          this.decorations = this.createLineHighlight(update.view, lineNumber);
        }
      }
    },
    {
      decorations: v => v.decorations
    }
  );
};
