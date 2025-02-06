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

const source2template = (source: string) => {
  const sourceLines = source.split('\n');
  const sourceLength = sourceLines.length || 0;
  const map = [];
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
  const doc = map2doc(map);
  return { map, doc };
};

export const createMetadataEditor = (notebookPanel: NotebookPanel) => {
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

      const initialState =
        cell.getMetadata('map') ??
        (() => {
          const { map, doc } = source2template(cell.sharedModel.source);
          console.log(map, doc);
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

      const view = new EditorView({
        state,
        parent: metadataEditor
      });

      // function adjustLines(doc: string, numLines: number): string {
      //   const lines = doc.split('\n');
      //   while (lines.length < numLines) {
      //     lines.push(''); // Add empty lines
      //   }
      //   while (lines.length > numLines) {
      //     lines.pop(); // Remove extra lines
      //   }
      //   return lines.join('\n');
      // }

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
