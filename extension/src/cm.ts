import {
  EditorView,
  Decoration,
  DecorationSet,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';

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
